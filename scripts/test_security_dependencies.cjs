const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { createRequire } = require("node:module");
const path = require("node:path");
const test = require("node:test");
const { pathToFileURL } = require("node:url");

function packageInfo(entry) {
  let directory = path.dirname(entry);
  for (;;) {
    try {
      const info = JSON.parse(
        readFileSync(path.join(directory, "package.json"), "utf8"),
      );
      if (info.name && info.version) return { directory, ...info };
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const parent = path.dirname(directory);
    assert.notEqual(parent, directory, `No package.json for ${entry}`);
    directory = parent;
  }
}

function atLeast(version, minimum) {
  const actual = version.split(".").map(Number);
  const expected = minimum.split(".").map(Number);
  for (let index = 0; index < 3; index++) {
    if (actual[index] !== expected[index])
      return actual[index] > expected[index];
  }
  return true;
}

const importFrom = (parent, name) =>
  import(pathToFileURL(parent.resolve(name)));
const vocs = createRequire(require.resolve("vocs"));
const tomlDocument =
  'title = "Docs"\ntags = ["wallet", "orders"]\n[site]\nname = "CoW"';

test("WalletConnect provider utils roundtrip pairing URIs in CJS and ESM", async () => {
  const provider = createRequire(
    require.resolve("@walletconnect/ethereum-provider"),
  );
  const entry = provider.resolve("@walletconnect/utils");
  const info = packageInfo(entry);
  assert.equal(info.dependencies["query-string"], undefined);
  const modules = [
    provider("@walletconnect/utils"),
    await import(pathToFileURL(path.join(info.directory, info.module))),
  ];
  const topic = "a".repeat(64);
  const symKey = "b".repeat(64);
  const uri = `wc:${topic}@2?relay-protocol=irn&symKey=${symKey}`;
  for (const utils of modules) {
    const parsed = utils.parseUri(uri);
    assert.equal(parsed.topic, topic);
    assert.equal(parsed.version, 2);
    assert.equal(parsed.symKey, symKey);
    assert.equal(parsed.relay.protocol, "irn");
    assert.deepEqual(utils.parseUri(utils.formatUri(parsed)), parsed);
  }
});

test("Each MetaMask consumer resolves patched UUID with v4, validate, and buffer support", () => {
  const wagmi = createRequire(require.resolve("wagmi"));
  const connectors = createRequire(wagmi.resolve("@wagmi/connectors"));
  const sdk = createRequire(connectors.resolve("@metamask/sdk"));
  const providers = createRequire(sdk.resolve("@metamask/providers"));
  const rpcErrors = createRequire(providers.resolve("@metamask/rpc-errors"));
  const consumers = [
    sdk,
    createRequire(sdk.resolve("@metamask/sdk-communication-layer")),
    createRequire(providers.resolve("@metamask/utils")),
    createRequire(rpcErrors.resolve("@metamask/utils")),
  ];
  for (const consumer of consumers) {
    const entry = consumer.resolve("uuid");
    assert(atLeast(packageInfo(entry).version, "11.1.1"), entry);
    const uuid = consumer("uuid");
    const id = uuid.v4();
    assert(uuid.validate(id), entry);
    assert.equal(uuid.version(id), 4);
    assert.equal(uuid.validate("invalid-channel-id"), false);
    const buffer = new Uint8Array(20);
    assert.equal(uuid.v4({}, buffer, 2), buffer);
    assert(uuid.validate(uuid.stringify(buffer, 2)), entry);
    assert.equal(buffer[0], 0);
    assert.equal(buffer[19], 0);
  }
});

test("UI Plotly and its worker bundle include patched MapLibre", () => {
  const ui = createRequire(require.resolve("@bleu/ui"));
  const plotly = createRequire(ui.resolve("plotly.js"));
  const maplibre = plotly.resolve("maplibre-gl/dist/maplibre-gl.mjs");
  assert(atLeast(packageInfo(maplibre).version, "6.4.1"));
  for (const entry of [
    "plotly.js/dist/plotly.js",
    "plotly.js/build/maplibre_worker.js",
  ]) {
    const bundle = readFileSync(ui.resolve(entry), "utf8");
    const versions = [
      ...bundle.matchAll(/maplibre-gl-js\/blob\/v(\d+\.\d+\.\d+)\/LICENSE/g),
    ].map((match) => match[1]);
    assert(versions.length > 0, `${entry} must identify its MapLibre`);
    for (const version of versions)
      assert(
        atLeast(version, "6.4.1"),
        `Bundled MapLibre ${version} is vulnerable`,
      );
  }
});

test("UI Router 7 exports remain available without browser globals", async () => {
  const ui = createRequire(require.resolve("@bleu/ui"));
  for (const name of ["react-router", "react-router-dom"]) {
    const entry = ui.resolve(name);
    assert.equal(packageInfo(entry).version.split(".")[0], "7");
    const router = await importFrom(ui, name);
    for (const key of [
      "useNavigate",
      "Link",
      "useNavigation",
      "useSearchParams",
    ])
      assert(router[key], `${name} must export ${key}`);
  }
  assert.equal(typeof window, "undefined");
  assert.equal(typeof document, "undefined");
});

test("Vocs TOML supports default and named parse exports with safe table prototypes", async () => {
  const toml = await importFrom(vocs, "toml");
  for (const parse of [toml.default.parse, toml.parse]) {
    const result = parse(tomlDocument);
    assert.equal(result.title, "Docs");
    assert.deepEqual(result.tags, ["wallet", "orders"]);
    assert.equal(result.site.name, "CoW");
    assert.equal(Object.getPrototypeOf(result), null);
    assert.equal(Object.getPrototypeOf(result.site), null);
    const key = "securityDependencyPollution";
    const hostile = parse(
      `__proto__.${key} = true\nconstructor.prototype.${key} = true`,
    );
    assert.equal(Object.getPrototypeOf(hostile), null);
    assert.equal(Object.getPrototypeOf(hostile.__proto__), null);
    assert.equal(Object.getPrototypeOf(hostile.constructor.prototype), null);
    assert.equal(Object.prototype[key], undefined);
    assert.equal({}[key], undefined);
    assert.throws(() => parse('title = "one"\ntitle = "two"'));
  }
});

test("Vocs remark plugins transform TOML arrays and tables into MDX frontmatter exports", async () => {
  const [unified, parse, mdx, frontmatter, mdxFrontmatter] = await Promise.all(
    [
      "unified",
      "remark-parse",
      "remark-mdx",
      "remark-frontmatter",
      "remark-mdx-frontmatter",
    ].map((name) => importFrom(vocs, name)),
  );
  const processor = unified
    .unified()
    .use(parse.default)
    .use(mdx.default)
    .use(frontmatter.default, ["toml"])
    .use(mdxFrontmatter.default);
  const tree = await processor.run(
    processor.parse(`+++\n${tomlDocument}\n+++\n\n# Orders\n`),
  );
  const exported = tree.children
    .filter((node) => node.type === "mdxjsEsm")
    .flatMap((node) => node.data.estree.body)
    .find((node) => node.type === "ExportNamedDeclaration");
  assert(exported);
  const declaration = exported.declaration.declarations[0];
  assert.equal(declaration.id.name, "frontmatter");
  const property = (node, name) =>
    node.properties.find((item) => (item.key.name ?? item.key.value) === name)
      .value;
  assert.equal(property(declaration.init, "title").value, "Docs");
  assert.deepEqual(
    property(declaration.init, "tags").elements.map((item) => item.value),
    ["wallet", "orders"],
  );
  assert.equal(
    property(property(declaration.init, "site"), "name").value,
    "CoW",
  );
});

test("Vocs Mermaid renderer loads a patched browser bundle and working KaTeX", () => {
  const renderer = createRequire(vocs.resolve("mermaid-isomorphic"));
  const mermaidEntry = renderer.resolve("mermaid");
  assert(atLeast(packageInfo(mermaidEntry).version, "12.2.0"));
  const bundle = readFileSync(
    renderer.resolve("mermaid/dist/mermaid.js"),
    "utf8",
  );
  const bundledVersions = [...bundle.matchAll(/katex@(\d+\.\d+\.\d+)/g)].map(
    (match) => match[1],
  );
  assert(bundledVersions.length > 0, "Browser bundle must identify its KaTeX");
  for (const version of bundledVersions)
    assert(
      atLeast(version, "0.18.2"),
      `Bundled KaTeX ${version} is vulnerable`,
    );
  const mermaid = createRequire(mermaidEntry);
  const katex = mermaid("katex");
  assert(atLeast(katex.version, "0.18.2"));
  const html = katex.renderToString("\\frac{1}{2}", { throwOnError: true });
  assert.match(html, /class="katex"/);
  assert.match(html, /<math/);
  assert.match(html, /<mfrac>/);
});
