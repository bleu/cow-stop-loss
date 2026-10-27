const path = require("node:path");
const { constants } = require("node:os");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "../..");
const portValue = process.env.APP_PORT ?? "3157";
const port = Number(portValue);
if (!/^\d+$/.test(portValue) || !Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("APP_PORT must be an integer between 1 and 65535.");
  process.exit(1);
}

const child = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: "",
      NEXT_PUBLIC_DRPC_KEY: "",
      NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${port}`,
    },
  },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("error", (error) => {
  console.error("Could not start the capture app:", error.message);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = signal ? 128 + constants.signals[signal] : (code ?? 1);
});
