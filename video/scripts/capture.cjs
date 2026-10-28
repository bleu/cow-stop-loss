const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { chromium } = require(
  process.env.PLAYWRIGHT_PATH ||
    path.resolve(__dirname, "../node_modules/playwright"),
);
const {
  NOW,
  ACCOUNT,
  createServices,
  injectWallet,
} = require("./fixtures/services.cjs");

const { captureConclusions } = require("./conclusions.cjs");
const { auditWallet, finalizeCapture } = require("./capture-safety.cjs");
const appUrl = process.env.APP_URL || "http://127.0.0.1:3157/app";
assert(
  ["localhost", "127.0.0.1"].includes(new URL(appUrl).hostname),
  "Capture requires a local app",
);
const output = path.resolve(__dirname, "../public/captures");
const audit = {
  rpcRequests: 0,
  graphqlRequests: 0,
  quoteRequests: 0,
  slippageRequests: 0,
  appData: [],
  feedReads: [],
  blocked: [],
  pageErrors: [],
  consoleErrors: [],
  walletCalls: [],
};
const metadata = {
  appUrl,
  fixedTime: new Date(NOW).toISOString(),
  viewport: { width: 640, height: 1600 },
  deviceScaleFactor: 2,
  market: { WETH_USD: 3500, USDC_USD: 1 },
  order: {
    chainId: 1,
    sell: "0.1 WETH",
    buy: "USDC",
    trigger: "3000 USDC/WETH",
    limit: "2970 USDC/WETH",
    expiry: "1 month",
  },
  screenshots: [],
  stages: [],
};

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH,
  });
  const context = await browser.newContext({
    viewport: metadata.viewport,
    deviceScaleFactor: metadata.deviceScaleFactor,
    colorScheme: "dark",
    reducedMotion: "reduce",
    locale: "en-US",
    timezoneId: "UTC",
    serviceWorkers: "block",
    recordVideo: { dir: output, size: metadata.viewport },
  });
  const intercept = createServices(audit);
  await context.route("**/*", (route) =>
    intercept(route, new URL(appUrl).origin),
  );
  await context.routeWebSocket("**/*", (socket) => {
    if (
      new URL(socket.url()).origin.replace(/^ws/, "http") ===
      new URL(appUrl).origin
    )
      socket.connectToServer();
    else {
      audit.blocked.push(`Blocked WebSocket ${socket.url()}`);
      socket.close();
    }
  });
  await auditWallet(context, audit, "form");
  await context.addInitScript(injectWallet);
  const videoStartedAt = Date.now();
  const page = await context.newPage();
  await page.clock.setFixedTime(NOW);
  page.setDefaultTimeout(30000);
  page.on("pageerror", (error) => audit.pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") audit.consoleErrors.push(message.text());
  });
  const panel = page.locator(".rescue-create-panel");
  let recordingStart;
  let completed = false;
  let conclusions;
  async function stage(name) {
    console.log(`Capture ${name}`);
    await page.mouse.move(metadata.viewport.width - 8, 20);
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.blur();
    });
    await page.waitForTimeout(350);
    const box = await panel.boundingBox();
    assert(box, "Create panel missing");
    const popover = page.locator("[cmdk-root]").last();
    const popoverBox = (await popover.isVisible().catch(() => false))
      ? await popover.boundingBox()
      : null;
    const left = Math.min(box.x, popoverBox ? popoverBox.x : box.x);
    const top = Math.min(box.y, popoverBox ? popoverBox.y : box.y);
    const right = Math.max(
      box.x + box.width,
      popoverBox ? popoverBox.x + popoverBox.width : 0,
    );
    const bottom = Math.max(
      box.y + box.height,
      popoverBox ? popoverBox.y + popoverBox.height : 0,
    );
    const clip = {
      x: Math.floor(left),
      y: Math.floor(top),
      width: Math.ceil(right) - Math.floor(left),
      height: Math.ceil(bottom) - Math.floor(top),
    };
    assert(
      clip.x >= 0 &&
        clip.y >= 0 &&
        clip.x + clip.width <= metadata.viewport.width &&
        clip.y + clip.height <= metadata.viewport.height,
      `${name}: full panel and popover must fit the viewport`,
    );
    function imageBounds(bounds) {
      return {
        x: (bounds.x - clip.x) * metadata.deviceScaleFactor,
        y: (bounds.y - clip.y) * metadata.deviceScaleFactor,
        width: bounds.width * metadata.deviceScaleFactor,
        height: bounds.height * metadata.deviceScaleFactor,
      };
    }
    const file = `${name}.png`;
    await page.screenshot({
      path: path.join(output, file),
      clip,
      animations: "disabled",
      caret: "hide",
      scale: "device",
    });
    const fields = { panel: imageBounds(box) };
    for (const [key, locator] of Object.entries({
      sellGroup: panel
        .getByRole("textbox", { name: "Sell amount", exact: true })
        .locator("xpath=ancestor::section[1]"),
      triggerGroup: panel
        .getByRole("textbox", { name: "Trigger price", exact: true })
        .locator("xpath=ancestor::section[1]"),
      receiveGroup: panel
        .locator('output[aria-label="Receive at least"]')
        .locator("xpath=ancestor::section[1]"),
      sellAmount: page.getByRole("textbox", {
        name: "Sell amount",
        exact: true,
      }),
      triggerPrice: page.getByRole("textbox", {
        name: "Trigger price",
        exact: true,
      }),
      receiveAmount: page.locator('output[aria-label="Receive at least"]'),
      limitGroup: panel
        .getByRole("textbox", { name: "Limit price", exact: true })
        .locator("xpath=ancestor::section[1]"),
      limitPrice: panel.getByRole("textbox", {
        name: "Limit price",
        exact: true,
      }),
      tokenSelector: page.locator('[data-side="sell"] button').first(),
      tokenPopover: page.locator("[cmdk-root]").last(),
      reviewButton: page.getByRole("button", {
        name: "Review Stop Loss order",
        exact: true,
      }),
      reviewAmounts: page.getByRole("group", {
        name: "Order amounts",
        exact: true,
      }),
      reviewTerms: page.getByRole("region", {
        name: "Order terms",
        exact: true,
      }),
    })) {
      if (await locator.isVisible().catch(() => false)) {
        const bounds = await locator.boundingBox();
        if (bounds) {
          assert(
            bounds.x >= clip.x &&
              bounds.y >= clip.y &&
              bounds.x + bounds.width <= clip.x + clip.width &&
              bounds.y + bounds.height <= clip.y + clip.height,
            `${name}: ${key} must fit the screenshot`,
          );
          fields[key] = imageBounds(bounds);
        }
      }
    }
    const requiredFields =
      name === "review"
        ? ["reviewAmounts", "reviewTerms"]
        : [
            "sellGroup",
            "triggerGroup",
            "receiveGroup",
            "sellAmount",
            "triggerPrice",
            "limitGroup",
            "limitPrice",
            "receiveAmount",
          ];
    for (const key of requiredFields)
      assert(fields[key], `${name}: missing ${key} bounds`);
    metadata.screenshots.push({
      file,
      width: clip.width * metadata.deviceScaleFactor,
      height: clip.height * metadata.deviceScaleFactor,
      clipCss: clip,
      panel: imageBounds(box),
      fields,
    });
    metadata.stages.push({
      name,
      seconds: (Date.now() - recordingStart) / 1000,
    });
  }
  try {
    console.log("Load and connect synthetic Browser wallet");
    await page.goto(appUrl, { waitUntil: "domcontentloaded", timeout: 180000 });
    console.log("Open wallet dialog");
    await page
      .getByRole("button", { name: "Connect wallet", exact: true })
      .click();
    console.log("Choose Browser wallet");
    await page
      .getByRole("button", { name: "Browser wallet", exact: true })
      .click();
    console.log("Wait for connected account");
    await page.getByTitle(ACCOUNT, { exact: true }).waitFor();
    console.log("Set one month expiry off-camera");
    await page
      .getByRole("button", { name: "Order settings", exact: true })
      .click();
    await page.getByRole("combobox", { name: "Expires", exact: true }).click();
    await page.getByRole("option", { name: "1 month", exact: true }).click();
    assert.equal(
      await page
        .getByRole("combobox", { name: "Expires", exact: true })
        .innerText(),
      "1 month",
    );
    await page
      .getByRole("button", { name: "Return to order", exact: true })
      .click();
    await panel.scrollIntoViewIfNeeded();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images].map((image) => image.decode().catch(() => {})),
      );
    });
    recordingStart = Date.now();
    metadata.recordingStartSeconds = (recordingStart - videoStartedAt) / 1000;
    await stage("form-empty");
    await page.waitForTimeout(1200);
    await page.locator('[data-side="sell"] button').first().click();
    await page.getByPlaceholder("Search supported tokens").waitFor();
    await page.getByPlaceholder("Search supported tokens").fill("WETH");
    await page.getByRole("option", { name: /Token Logo WETH/ }).waitFor();
    await page.waitForTimeout(500);
    await stage("token-selector");
    await page.waitForTimeout(1200);
    await page.getByRole("option", { name: /Token Logo WETH/ }).click();
    await page
      .getByRole("textbox", { name: "Sell amount", exact: true })
      .pressSequentially("0.1", { delay: 160 });
    await page.waitForTimeout(1800);
    await stage("amount-entered");
    await page
      .getByRole("textbox", { name: "Trigger price", exact: true })
      .pressSequentially("3000", { delay: 160 });
    await page
      .getByRole("textbox", { name: "Limit price", exact: true })
      .fill("2970");
    await page
      .getByRole("button", { name: "Review Stop Loss order", exact: true })
      .waitFor({ state: "visible" });
    await page.waitForTimeout(900);
    assert.equal(
      await page
        .getByRole("textbox", { name: "Sell amount", exact: true })
        .inputValue(),
      "0.1",
    );
    assert.equal(
      await page
        .getByRole("textbox", { name: "Trigger price", exact: true })
        .inputValue(),
      "3000",
    );
    assert.equal(
      await page
        .locator('output[aria-label="Receive at least"]')
        .getAttribute("title"),
      "297",
    );
    assert.equal(
      await page
        .getByRole("textbox", { name: "Limit price", exact: true })
        .inputValue(),
      "2970",
    );
    assert.match(await panel.innerText(), /Market: ≈ 3,500 USDC per WETH/);
    await stage("trigger-entered");
    await page.waitForTimeout(1500);
    await page
      .getByRole("button", { name: "Review Stop Loss order", exact: true })
      .click();
    const review = page.getByRole("region", {
      name: "Review stop-loss order",
      exact: true,
    });
    await review.waitFor();
    await page
      .getByRole("heading", { name: "Confirm your order", exact: true })
      .waitFor();
    await review
      .getByRole("button", { name: "Approve WETH", exact: true })
      .waitFor();
    await page.waitForTimeout(900);
    await stage("review");
    assert.equal(
      await review
        .getByRole("button", {
          name: "Show exact amount: 0.1 WETH",
          exact: true,
        })
        .count(),
      1,
    );
    assert.equal(
      await review
        .getByRole("button", {
          name: "Show exact amount: 297 USDC",
          exact: true,
        })
        .count(),
      1,
    );
    assert.equal(
      await review
        .getByRole("button", {
          name: "Show exact trigger price: 3000 USDC / WETH",
          exact: true,
        })
        .count(),
      1,
    );
    assert.match(await review.innerText(), /Nov 25, 2026/);
    assert.equal(await page.evaluate(() => window.ethereum.chainId), "0x1");
    assert.equal(audit.appData.length, 1);
    assert(audit.quoteRequests > 0);
    conclusions = await captureConclusions({ browser, appUrl, output, audit });
    await page.waitForTimeout(2000);
    completed = true;
  } catch (error) {
    metadata.passed = false;
    metadata.failure = error.stack;
    await page
      .screenshot({ path: path.join(output, "failure.png"), fullPage: true })
      .catch(() => {});
    fs.writeFileSync(
      path.join(output, "failure.txt"),
      await page
        .locator("body")
        .innerText()
        .catch(() => "Unavailable"),
    );
    console.error(error);
    process.exitCode = 1;
  } finally {
    metadata.video = {
      file: "interaction.webm",
      width: metadata.viewport.width,
      height: metadata.viewport.height,
      note: "Viewport recording includes off-camera wallet and settings setup. Use stage timestamps and clipCss for the panel.",
    };
    const video = page.video();
    try {
      await finalizeCapture({
        audit,
        metadata,
        completed,
        stop: async () => {
          try {
            await context.close();
            await video.saveAs(path.join(output, "interaction.webm"));
            await video.delete();
          } finally {
            await browser.close();
          }
        },
      });
    } catch (error) {
      metadata.passed = false;
      metadata.failure = error.stack;
      console.error(error);
      process.exitCode = 1;
    } finally {
      if (conclusions) {
        conclusions.walletCalls = ["open", "trigger-reached", "filled"].map(
          (state) => ({
            state,
            calls: audit.walletCalls.filter((call) => call.scene === state),
          }),
        );
        conclusions.passed = metadata.passed === true;
        if (!conclusions.passed) conclusions.failure = metadata.failure;
        fs.writeFileSync(
          path.join(output, "conclusions.json"),
          JSON.stringify(conclusions, null, 2),
        );
      }
      fs.writeFileSync(
        path.join(output, "metadata.json"),
        JSON.stringify(metadata, null, 2),
      );
      fs.writeFileSync(
        path.join(output, "audit.json"),
        JSON.stringify(audit, null, 2),
      );
    }
    console.log(JSON.stringify(metadata, null, 2));
  }
})();
