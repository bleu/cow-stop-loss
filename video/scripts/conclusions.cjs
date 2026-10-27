const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { auditWallet } = require("./capture-safety.cjs");
const {
  NOW,
  ACCOUNT,
  ORDER_EVENT_ID,
  createServices,
  injectWallet,
} = require("./fixtures/services.cjs");

async function captureConclusions({ browser, appUrl, output, audit }) {
  assert(
    ["localhost", "127.0.0.1"].includes(new URL(appUrl).hostname),
    "Capture requires a local app",
  );
  const metadata = {
    appUrl,
    fixedTime: new Date(NOW).toISOString(),
    viewport: { width: 480, height: 1600 },
    deviceScaleFactor: 2,
    fixture:
      "Synthetic read-only order data in the real local app. No order was placed or executed.",
    screenshots: [],
    walletCalls: [],
    passed: false,
  };
  try {
    for (const state of ["open", "trigger-reached", "filled"]) {
      // A new context prevents wallet state and order caches from crossing scenes.
      const context = await browser.newContext({
        viewport: metadata.viewport,
        deviceScaleFactor: metadata.deviceScaleFactor,
        colorScheme: "dark",
        reducedMotion: "reduce",
        locale: "en-US",
        timezoneId: "UTC",
        serviceWorkers: "block",
      });
      const intercept = createServices(audit, { orderState: state });
      const origin = new URL(appUrl).origin;
      await context.route("**/*", (route) => intercept(route, origin));
      await context.routeWebSocket("**/*", (socket) => {
        if (new URL(socket.url()).origin.replace(/^ws/, "http") === origin)
          socket.connectToServer();
        else {
          audit.blocked.push(`Blocked WebSocket ${socket.url()}`);
          socket.close();
        }
      });
      await auditWallet(context, audit, state);
      await context.addInitScript(injectWallet);
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      await page.clock.setFixedTime(NOW);
      page.on("pageerror", (error) => audit.pageErrors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error")
          audit.consoleErrors.push(message.text());
      });
      async function screenshot(file, panel, locators, { through } = {}) {
        if (through)
          await panel.evaluate((element) =>
            element.scrollIntoView({ block: "start" }),
          );
        else
          await panel.evaluate((element) =>
            element.scrollIntoView({ block: "center" }),
          );
        await page.mouse.move(metadata.viewport.width - 8, 20);
        await page.evaluate(async () => {
          if (document.activeElement instanceof HTMLElement)
            document.activeElement.blur();
          await document.fonts.ready;
          await Promise.all(
            [...document.images].map((image) => image.decode().catch(() => {})),
          );
        });
        await page.waitForTimeout(500);
        const box = await panel.boundingBox();
        assert(box, `${file}: panel missing`);
        if (through) {
          const bottom = await through.boundingBox();
          assert(bottom, `${file}: final section missing`);
          box.height = bottom.y + bottom.height - box.y;
        }
        const clip = {
          x: Math.floor(box.x),
          y: Math.floor(box.y),
          width: Math.ceil(box.x + box.width) - Math.floor(box.x),
          height: Math.ceil(box.y + box.height) - Math.floor(box.y),
        };
        assert(
          clip.x >= 0 &&
            clip.y >= 0 &&
            clip.x + clip.width <= metadata.viewport.width &&
            clip.y + clip.height <= metadata.viewport.height,
          `${file}: panel must fit viewport`,
        );
        const imageBounds = (bounds) => ({
          x: (bounds.x - clip.x) * 2,
          y: (bounds.y - clip.y) * 2,
          width: bounds.width * 2,
          height: bounds.height * 2,
        });
        const fields = { panel: imageBounds(box) };
        for (const [key, locator] of Object.entries(locators)) {
          await locator.waitFor({ state: "visible" });
          const bounds = await locator.boundingBox();
          assert(
            bounds &&
              bounds.x >= clip.x &&
              bounds.y >= clip.y &&
              bounds.x + bounds.width <= clip.x + clip.width &&
              bounds.y + bounds.height <= clip.y + clip.height,
            `${file}: ${key} must fit screenshot`,
          );
          fields[key] = imageBounds(bounds);
        }
        await page.screenshot({
          path: path.join(output, file),
          clip,
          animations: "disabled",
          caret: "hide",
          scale: "device",
        });
        metadata.screenshots.push({
          file,
          width: clip.width * 2,
          height: clip.height * 2,
          clipCss: clip,
          fields,
          state,
          status: state === "filled" ? "Filled" : "Open",
          market: { WETH_USD: state === "open" ? 3500 : 3000, USDC_USD: 1 },
          order: {
            chainId: 1,
            eventId: ORDER_EVENT_ID,
            sell: "0.1 WETH",
            minimumBuy: "297 USDC",
            trigger: "3000 USDC/WETH",
            validTo: "2026-11-25T12:00:00Z",
            ...(state === "filled"
              ? {
                  executedSell: "0.1 WETH",
                  executedBuy: "300 USDC",
                  executedFee: "0",
                }
              : {}),
          },
        });
      }
      try {
        console.log(`Capture conclusion ${state}`);
        await page.goto(appUrl, {
          waitUntil: "domcontentloaded",
          timeout: 180000,
        });
        await page
          .getByRole("button", { name: "Connect wallet", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Browser wallet", exact: true })
          .click();
        await page.getByTitle(ACCOUNT, { exact: true }).waitFor();
        const panel = page.locator(".rescue-portfolio-panel");
        const row = page.getByRole("row", {
          name: `View order ${ORDER_EVENT_ID} on Ethereum`,
          exact: true,
        });
        await row.waitFor();
        await panel.scrollIntoViewIfNeeded();
        const status = row.getByText(state === "filled" ? "Filled" : "Open", {
          exact: true,
        });
        await status.waitFor();
        if (state !== "filled")
          await row
            .getByText(state === "open" ? "14.29% below market" : "At market", {
              exact: true,
            })
            .waitFor();
        assert.match(await row.innerText(), /0\.1/);
        assert.match(await row.innerText(), /297/);
        await screenshot(
          state === "filled"
            ? "filled-order.png"
            : state === "open"
              ? "open-order.png"
              : "trigger-reached.png",
          panel,
          {
            orderRow: row,
            status,
            orderAmount: row.locator('[aria-label="0.1 WETH for 297 USDC"]'),
            triggerPrice: row.getByText("3,000 USDC", { exact: true }),
            expiry: row.locator("time"),
            ...(state !== "filled"
              ? {
                  marketDistance: row.getByText(
                    state === "open" ? "14.29% below market" : "At market",
                    { exact: true },
                  ),
                }
              : {}),
          },
        );
        if (state === "filled") {
          await row.click();
          await page
            .getByRole("heading", { name: "Order details", exact: true })
            .waitFor();
          await page.getByText("Fully executed", { exact: true }).waitFor();
          const execution = page
            .getByRole("heading", { name: "Execution", exact: true })
            .locator("xpath=ancestor::section[1]");
          await execution.waitFor();
          assert.match(
            await execution
              .locator("dd")
              .filter({ hasText: /^0\.1 WETH$/ })
              .innerText(),
            /0\.1 WETH/,
          );
          assert.match(
            await execution
              .locator("dd")
              .filter({ hasText: /^300 USDC$/ })
              .innerText(),
            /300 USDC/,
          );
          assert.equal(
            await page
              .getByRole("link", { name: "Creation transaction", exact: true })
              .count(),
            0,
          );
          const detail = page.locator(".rescue-detail-page");
          const summary = page
            .getByRole("heading", { name: "WETH for USDC", exact: true })
            .locator("xpath=ancestor::section[1]");
          await screenshot(
            "filled-detail.png",
            detail,
            {
              status: page
                .getByText("Fully executed", { exact: true })
                .locator("xpath=ancestor::aside[1]"),
              orderSummary: summary,
              sellAmount: summary.locator('[aria-label="Sell amount"]'),
              minimumBuy: summary.locator('[aria-label="Minimum buy amount"]'),
            },
            { through: summary },
          );
          await screenshot("execution-detail.png", execution, {
            executionSection: execution,
            executedSell: execution
              .locator("dd")
              .filter({ hasText: /^0\.1 WETH$/ }),
            executedBuy: execution
              .locator("dd")
              .filter({ hasText: /^300 USDC$/ }),
          });
        }
      } catch (error) {
        await page
          .screenshot({
            path: path.join(output, "conclusions-failure.png"),
            fullPage: true,
          })
          .catch(() => {});
        fs.writeFileSync(
          path.join(output, "conclusions-failure.txt"),
          await page
            .locator("body")
            .innerText()
            .catch(() => "Unavailable"),
        );
        throw error;
      } finally {
        await context.close();
      }
    }
    return metadata;
  } catch (error) {
    metadata.failure = error.stack;
    throw error;
  } finally {
    fs.writeFileSync(
      path.join(output, "conclusions.json"),
      JSON.stringify(metadata, null, 2),
    );
  }
}

module.exports = { captureConclusions };
