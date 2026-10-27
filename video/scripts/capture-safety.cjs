const assert = require("node:assert/strict");

async function auditWallet(context, audit, scene) {
  await context.exposeBinding("__captureWalletCall", (_source, call) => {
    audit.walletCalls.push({ scene, ...call });
  });
}

async function finalizeCapture({ audit, metadata, completed, stop }) {
  metadata.passed = false;
  await stop();
  if (!completed) return;
  const allowed = new Set([
    "eth_accounts",
    "eth_requestAccounts",
    "eth_chainId",
    "wallet_requestPermissions",
    "wallet_getPermissions",
    "wallet_revokePermissions",
  ]);
  assert(
    audit.walletCalls.every(({ method }) => allowed.has(method)),
    "Unexpected wallet request",
  );
  assert.deepEqual(audit.blocked, []);
  assert.deepEqual(audit.pageErrors, []);
  const knownWarning =
    '[["confirmed-stop-loss-cancellations"]]: No queryFn was passed';
  metadata.knownConsoleWarnings = [
    ...new Set(
      audit.consoleErrors.filter((message) => message.startsWith(knownWarning)),
    ),
  ];
  assert.deepEqual(
    audit.consoleErrors.filter((message) => !message.startsWith(knownWarning)),
    [],
  );
  metadata.passed = true;
}

module.exports = { auditWallet, finalizeCapture };
