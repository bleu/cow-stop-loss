const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const { encodeAbiParameters, parseAbiParameters, toFunctionSelector, encodeFunctionResult, decodeFunctionData, multicall3Abi } = require('viem');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const catalog = require('../src/lib/tokenCatalogData.json');
const ids = [1, 100, 42161, 8453, 137, 43114, 56, 59144, 9745, 11155111];
const output = process.env.BROWSER_REPORT_DIR || '/tmp';
const checks = [], errors = [], consoleErrors = [], appData = [], walletCalls = [];
const factory = '0x3333333333333333333333333333333333333333';
const owner = '0x4444444444444444444444444444444444444444';
const composable = '0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74';
const now = Math.floor(Date.now() / 1000);
const word = n => encodeAbiParameters(parseAbiParameters('uint256'), [BigInt(n)]);
const address = value => encodeAbiParameters(parseAbiParameters('address'), [value]);
const selector = toFunctionSelector;

function call(to, data) {
  to = to.toLowerCase();
  const sig = data.slice(0, 10);
  if (sig === selector('aggregate3((address,bool,bytes)[])')) {
    const decoded = decodeFunctionData({ abi: multicall3Abi, data });
    return encodeFunctionResult({ abi: multicall3Abi, functionName: 'aggregate3', result: decoded.args[0].map(item => ({ success: true, returnData: call(item.target, item.callData) })) });
  }
  if (sig === selector('COW_SHED_FACTORY()') || sig === selector('trustedExecutor()')) return address(factory);
  if (sig === selector('proxyOf(address)')) return address(owner);
  if (sig === selector('COMPOSABLE_COW()') || sig === selector('domainVerifiers(address)')) return address(composable);
  if (sig === selector('domainSeparator()')) return '0x' + '11'.repeat(32);
  if (sig === selector('allowance(address,address)')) return word(0);
  const token = catalog.tokens.find(item => item.address.toLowerCase() === to);
  if (sig === selector('balanceOf(address)')) return word(100n * 10n ** BigInt(token?.decimals ?? 18));
  if (sig === selector('decimals()')) return word(token?.decimals ?? 8);
  if (sig === selector('symbol()')) return encodeAbiParameters(parseAbiParameters('string'), [token?.symbol ?? 'TEST']);
  if (sig === selector('name()')) return encodeAbiParameters(parseAbiParameters('string'), [token?.name ?? 'Test token']);
  if (sig === selector('latestRoundData()')) {
    const updatedAt = BigInt(now - (to === '0x8fffffd4afb6115b954bd326cbe7b4ba576818f6' ? 60000 : 60));
    return encodeAbiParameters(parseAbiParameters('uint80,int256,uint256,uint256,uint80'), [1n, 100000000n, updatedAt, updatedAt, 1n]);
  }
  throw new Error(`Unmocked read ${to} ${sig}`);
}

function rpc(request) {
  let result;
  if (request.method === 'eth_blockNumber') result = '0x123456';
  else if (request.method === 'eth_chainId') result = '0x1';
  else if (request.method === 'eth_getCode') result = '0x60006000';
  else if (request.method === 'eth_getBalance') result = word(100000000000000000000n);
  else if (request.method === 'eth_getBlockByNumber') result = { number: '0x123456', hash: '0x' + 'ab'.repeat(32), parentHash: '0x' + 'cd'.repeat(32), timestamp: '0x' + now.toString(16), nonce: '0x0000000000000000', difficulty: '0x0', totalDifficulty: '0x0', extraData: '0x', gasLimit: '0x1c9c380', gasUsed: '0x0', miner: factory, mixHash: '0x' + '00'.repeat(32), receiptsRoot: '0x' + '00'.repeat(32), sha3Uncles: '0x' + '00'.repeat(32), stateRoot: '0x' + '00'.repeat(32), transactionsRoot: '0x' + '00'.repeat(32), transactions: [], uncles: [], logsBloom: '0x' + '00'.repeat(256), size: '0x1', baseFeePerGas: '0x1' };
  else if (request.method === 'eth_call') {
    try { result = call(request.params[0].to, request.params[0].data); }
    catch (error) { return { jsonrpc: '2.0', id: request.id, error: { code: -32000, message: error.message } }; }
  } else return { jsonrpc: '2.0', id: request.id, error: { code: -32000, message: 'Unsupported fixture RPC ' + request.method } };
  return { jsonrpc: '2.0', id: request.id, result };
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  await context.addInitScript(() => {
    const listeners = {};
    const provider = {
      chainId: '0x89', accounts: [], calls: [],
      on(event, fn) { (listeners[event] ??= []).push(fn); return provider; },
      removeListener(event, fn) { listeners[event] = (listeners[event] ?? []).filter(item => item !== fn); return provider; },
      emit(event, arg) { for (const fn of listeners[event] ?? []) fn(arg); },
      setAccount(value) { provider.accounts = [value]; provider.emit('accountsChanged', provider.accounts); },
      async request({ method, params }) {
        provider.calls.push({ method, params });
        if (/sign|sendTransaction|sendRawTransaction/i.test(method)) throw new Error('Signing and transactions blocked by fixture');
        if (method === 'eth_requestAccounts') { provider.accounts = ['0x1111111111111111111111111111111111111111']; return provider.accounts; }
        if (method === 'eth_accounts') return provider.accounts;
        if (method === 'eth_chainId') return provider.chainId;
        if (method === 'wallet_requestPermissions' || method === 'wallet_getPermissions') return [{ parentCapability: 'eth_accounts' }];
        if (method === 'wallet_revokePermissions' || method === 'wallet_addEthereumChain') return null;
        if (method === 'wallet_switchEthereumChain') { provider.chainId = params[0].chainId; provider.emit('chainChanged', provider.chainId); return null; }
        throw new Error('Unexpected wallet method ' + method);
      },
    };
    window.ethereum = provider;
  });
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return route.continue();
    let body; try { body = JSON.parse(request.postData() || 'null'); } catch {}
    if (request.method() === 'PUT' && url.pathname.includes('/app_data/')) {
      appData.push(request.url());
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(url.pathname.split('/').pop()) });
    }
    if (body?.query) {
      const field = body.query.includes('ownerMappings') ? 'ownerMappings' : 'conditionalOrderGenerators';
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { [field]: { items: [], pageInfo: { hasNextPage: false, endCursor: null } } } }) });
    }
    if (body?.jsonrpc || Array.isArray(body)) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(Array.isArray(body) ? body.map(rpc) : rpc(body)) });
    return route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  let passed = false, failure;
  try {
    await page.goto(process.env.APP_URL || 'http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.getByRole('button', { name: 'Connect wallet', exact: true }).waitFor({ timeout: 120000 });
    await page.getByRole('textbox', { name: 'Sell amount', exact: true }).waitFor();
    assert(await page.getByRole('button', { name: 'Connect wallet to place order', exact: true }).isVisible());
    assert.equal(await page.getByText(/USD buy feed can stop reporting/).count(), 0);
    checks.push('Standalone root, no blanket warning, disconnected wallet connection');
    await page.screenshot({ path: path.join(output, 'cow-policy-disconnected.png'), fullPage: true });
    await page.getByRole('button', { name: 'Connect wallet', exact: true }).click();
    await page.getByRole('button', { name: 'Browser wallet', exact: true }).click();
    await page.getByTitle('0x1111111111111111111111111111111111111111', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.ethereum.chainId), '0x89');
    assert.equal(await page.evaluate(() => window.ethereum.calls.filter(item => item.method === 'wallet_switchEthereumChain').length), 0);
    checks.push('Wallet connection preserves Polygon; no automatic network switch');
    for (const id of ids) {
      await page.getByRole('button', { name: 'Switch wallet network', exact: true }).click();
      for (const other of ids) assert(await page.getByTestId('rk-chain-option-' + other).isVisible());
      for (const [iconId, name] of [[59144, 'linea'], [9745, 'plasma']]) {
        const image = page.getByTestId('rk-chain-option-' + iconId + '-icon').locator('img');
        await image.waitFor(); await image.evaluate(img => img.decode());
        assert(await image.evaluate(img => img.complete && img.naturalWidth > 0));
        assert.equal(await image.getAttribute('src'), '/assets/chains/' + name + '.svg');
      }
      if (id === 1) {
        checks.push('Actual RainbowKit network menu: Linea and Plasma images loaded');
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(output, 'cow-policy-network-menu.png'), fullPage: true });
      }
      await page.getByTestId('rk-chain-option-' + id).click();
      await page.waitForFunction(value => Number(window.ethereum.chainId) === value, id);
      await page.getByRole('button', { name: 'Select token', exact: true }).waitFor();
      if (id !== 11155111 && id !== 1) {
        await page.getByRole('alert').filter({ hasText: 'Select Ethereum' }).first().waitFor();
        assert.equal(await page.getByRole('button', { name: 'Select tokens', exact: true }).isEnabled(), false);
      } else {
        assert.equal(await page.getByText(/USD buy feed can stop reporting/).count(), 0);
      }
      await page.getByRole('button', { name: 'Select token', exact: true }).click();
      await page.getByPlaceholder('Search supported tokens').waitFor();
      assert.equal(await page.getByRole('option').count(), id === 11155111 ? 1 : id === 1 ? 3 : 0);
      if (id === 1) {
        for (const symbol of ['WETH', 'LINK', 'UNI']) assert(await page.getByRole('option', { name: new RegExp(symbol) }).isVisible());
      }
      await page.keyboard.press('Escape');
      assert.equal(appData.length, 0);
      checks.push(`Network ${id}: expected creation policy, no publication`);
    }
    await page.getByRole('button', { name: 'Select token', exact: true }).click();
    await page.getByRole('option', { name: /WETH/ }).click();
    await page.getByPlaceholder('Search supported tokens').waitFor({ state: 'hidden' });
    await page.getByRole('textbox', { name: 'Sell amount', exact: true }).fill('1');
    await page.getByRole('textbox', { name: 'Trigger price', exact: true }).fill('0.95');
    await page.getByRole('button', { name: 'Order settings', exact: true }).click();
    const settings = page.getByRole('region', { name: 'Order settings', exact: true });
    const expiry = settings.getByRole('combobox', { name: 'Expires', exact: true });
    await expiry.waitFor();
    assert.equal(await expiry.innerText(), '6 months (max)');
    assert.equal(await settings.locator('fieldset').count(), 1);
    assert.equal(await settings.locator('.rescue-input-inline').count(), 5);
    const maxAge = settings.getByRole('spinbutton', { name: 'Maximum oracle age (hours)', exact: true });
    assert.equal(Number(await maxAge.getAttribute('min')), 1 / 3600);
    assert.equal(Number(await maxAge.getAttribute('max')), 24);
    assert.equal(await page.getByRole('textbox', { name: 'Sell amount', exact: true }).count(), 0);
    await page.screenshot({ path: path.join(output, 'cow-policy-settings.png'), fullPage: true });
    await settings.getByRole('button', { name: 'Return to order', exact: true }).click();
    assert.equal(await page.getByRole('textbox', { name: 'Sell amount', exact: true }).inputValue(), '1');
    assert.equal(await page.getByRole('textbox', { name: 'Trigger price', exact: true }).inputValue(), '0.95');
    checks.push('New settings layout, six-month expiry, bounded oracle age, and preserved draft');
    await page.getByRole('button', { name: 'Review Stop Loss order', exact: true }).click();
    const panel = page.getByRole('region', { name: 'Review stop-loss order', exact: true });
    await panel.waitFor({ timeout: 20000 });
    const links = await panel.locator('a').evaluateAll(items => items.map(item => item.href.toLowerCase()));
    assert(links.some(value => value.includes('0x57cb700070cb1b0475e2d668fa8e89cf0dda9509')));
    assert(links.some(value => value.includes('0xed2d417d759b1e77fe6a8920c79ae4ce6d6930f7')));
    assert.equal(appData.length, 1);
    checks.push('Sepolia TEST review uses preserved TEST feeds; publication intercepted');
    await page.screenshot({ path: path.join(output, 'cow-policy-test-review.png'), fullPage: true });
    await page.evaluate(() => window.ethereum.setAccount('0x2222222222222222222222222222222222222222'));
    await page.getByRole('button', { name: 'Select token', exact: true }).waitFor();
    assert.equal(await page.getByRole('textbox', { name: 'Sell amount', exact: true }).inputValue(), '');
    assert.equal(await panel.count(), 0);
    checks.push('Account change clears test review and amounts');
    await page.getByRole('button', { name: 'Switch wallet network', exact: true }).click();
    await page.getByTestId('rk-chain-option-1').click();
    await page.waitForFunction(() => Number(window.ethereum.chainId) === 1);
    await page.getByRole('button', { name: 'Select token', exact: true }).click();
    await page.getByRole('option', { name: /WETH/ }).click();
    await page.getByPlaceholder('Search supported tokens').waitFor({ state: 'hidden' });
    await page.getByRole('textbox', { name: 'Sell amount', exact: true }).fill('1');
    await page.getByRole('textbox', { name: 'Trigger price', exact: true }).fill('0.95');
    await page.getByRole('button', { name: 'Review Stop Loss order', exact: true }).click();
    await panel.waitFor({ timeout: 20000 });
    const productionLinks = await panel.locator('a').evaluateAll(items => items.map(item => item.href.toLowerCase()));
    assert(productionLinks.some(value => value.includes('0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419')));
    assert(productionLinks.some(value => value.includes('0x8fffffd4afb6115b954bd326cbe7b4ba576818f6')));
    assert.equal(appData.length, 2);
    checks.push('Ethereum WETH/USDC production review uses approved feeds; publication intercepted');
    await page.screenshot({ path: path.join(output, 'cow-policy-ethereum-review.png'), fullPage: true });
    walletCalls.push(...await page.evaluate(() => window.ethereum.calls));
    assert.equal(walletCalls.filter(item => /sign|sendTransaction|sendRawTransaction/i.test(item.method)).length, 0);
    assert.deepEqual(errors, []);
    assert.deepEqual(consoleErrors, []);
    checks.push('No signing, transactions, page errors, or console errors');
    passed = true;
  } catch (error) {
    failure = error.stack;
    await page.screenshot({ path: path.join(output, 'cow-policy-failure.png'), fullPage: true });
    console.error(await page.locator('body').innerText());
    process.exitCode = 1;
  } finally {
    const report = { passed, failure, checks, errors, consoleErrors, appData, walletCalls };
    fs.writeFileSync(path.join(output, 'cow-policy-browser-results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    await browser.close();
  }
})();
