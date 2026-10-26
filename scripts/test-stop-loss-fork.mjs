import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout as sleep } from "node:timers/promises";

const blockNumber = 26277440;
const blockHash =
  "0x07d048512650841ce2d67f7ed9b85d2fd7c38fbe731118b46730abcfe63e39a8";
const upstream = process.env.FORK_RPC_URL ?? "https://eth.drpc.org";
const server = createServer();
server.listen(0, "127.0.0.1");
await once(server, "listening");
const { port } = server.address();
await new Promise((resolve) => server.close(resolve));
const url = `http://127.0.0.1:${port}`;
const anvil = spawn(
  "anvil",
  [
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--chain-id",
    "1",
    "--fork-url",
    upstream,
    "--fork-block-number",
    String(blockNumber),
    "--quiet",
  ],
  { stdio: "ignore" },
);
let anvilError;
anvil.on("error", (error) => {
  anvilError = error;
});
let jest;
const cancellation = new AbortController();
const stop = () => {
  jest?.kill("SIGTERM");
  anvil.kill("SIGTERM");
};
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    process.exitCode = signal === "SIGINT" ? 130 : 143;
    cancellation.abort();
    stop();
  });
}
async function rpc(method, params = []) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.any([cancellation.signal, AbortSignal.timeout(5000)]),
  });
  const body = await response.json();
  if (body.error) throw new Error(body.error.message);
  return body.result;
}
try {
  const deadline = Date.now() + 90000;
  while (true) {
    cancellation.signal.throwIfAborted();
    if (anvilError) throw anvilError;
    if (anvil.exitCode !== null || anvil.signalCode !== null)
      throw new Error(
        "Anvil exited before it was ready. Check fork RPC access.",
      );
    try {
      const version = await rpc("web3_clientVersion");
      if (!version.toLowerCase().includes("anvil"))
        throw new Error("Expected Anvil");
      break;
    } catch (error) {
      cancellation.signal.throwIfAborted();
      if (Date.now() > deadline) throw error;
      await sleep(500, undefined, { signal: cancellation.signal });
    }
  }
  const block = await rpc("eth_getBlockByNumber", [
    `0x${blockNumber.toString(16)}`,
    false,
  ]);
  if (block?.hash !== blockHash || (await rpc("eth_chainId")) !== "0x1") {
    throw new Error(
      "Fork chain or pinned block hash does not match the fixture",
    );
  }
  cancellation.signal.throwIfAborted();
  console.log(`Ethereum fork: block ${blockNumber}, hash ${blockHash}`);
  jest = spawn(
    process.execPath,
    [
      "node_modules/jest/bin/jest.js",
      "--config",
      "jest.fork.config.js",
      "--runInBand",
    ],
    {
      stdio: "inherit",
      env: { ...process.env, FORK_TEST_RPC_URL: url },
    },
  );
  const [code] = await once(jest, "exit");
  if (!cancellation.signal.aborted) process.exitCode = code ?? 1;
} catch (error) {
  if (!cancellation.signal.aborted) {
    console.error(error.message.replaceAll(upstream, "<fork RPC>"));
    process.exitCode = 1;
  }
} finally {
  stop();
  if (anvil.exitCode === null && anvil.signalCode === null && !anvilError)
    await once(anvil, "exit");
}
