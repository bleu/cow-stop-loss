import { readFileSync } from "fs";
import path from "path";

import catalog from "../tokenCatalogData.json";

type Identity = { chainId: number; address: string; localLogo: string };
type MetadataFields = { symbol: string; name: string; decimals: number };
type MetadataOverride = Pick<Identity, "chainId" | "address"> & {
  metadata: Partial<MetadataFields>;
  expected?: Partial<MetadataFields>;
  reason: string;
};
type MetadataResolution = {
  chainId: number;
  address: string;
  source: string;
  overriddenFields: string[];
};

function read<T>(filename: string): T {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), "scripts", filename), "utf8"),
  ) as T;
}

function key(token: { chainId: number; address: string }): string {
  return `${token.chainId}:${token.address.toLowerCase()}`;
}

const identities = read<{ tokens: Identity[] }>("catalog-identities.json");
const overrides = read<{ tokens: MetadataOverride[] }>(
  "catalog-metadata-overrides.json",
);
const sources = read<{
  revision: string;
  sources: { id: string; url: string; sha256: string }[];
}>("catalog-metadata-sources.json");
const report = read<{
  tokens: MetadataResolution[];
  summary: {
    tokens: number;
    external: number;
    local: number;
    corrected: number;
  };
}>("catalog-metadata-report.json");

it("keeps reviewed identities and local images without handwritten display metadata", () => {
  expect(identities.tokens.map(key).sort()).toEqual(
    catalog.tokens.map(key).sort(),
  );
  for (const identity of identities.tokens) {
    expect(identity).not.toHaveProperty("symbol");
    expect(identity).not.toHaveProperty("name");
    expect(identity).not.toHaveProperty("decimals");
    expect(
      catalog.tokens.find((token) => key(token) === key(identity))?.logoURI,
    ).toBe(identity.localLogo);
  }
});

it("accounts for every generated token without changing creation approval", () => {
  expect(report.tokens.map(key).sort()).toEqual(catalog.tokens.map(key).sort());
  expect(report.summary.tokens).toBe(catalog.tokens.length);
  expect(report.summary.external).toBe(
    report.tokens.filter((token) => token.source !== "local").length,
  );
  expect(report.summary.local).toBe(
    report.tokens.filter((token) => token.source === "local").length,
  );
  expect(report.summary.corrected).toBe(
    overrides.tokens.filter((token) => token.expected).length,
  );
  const sourceIds = new Set(sources.sources.map((source) => source.id));
  for (const token of report.tokens) {
    expect(token.source === "local" || sourceIds.has(token.source)).toBe(true);
  }
  for (const token of catalog.tokens) {
    expect(token.oracles).toEqual({});
    expect(token.oracleApprovals).toEqual({});
  }
});

it("keeps full local metadata only for gaps and records field-level corrections", () => {
  const generated = new Map(catalog.tokens.map((token) => [key(token), token]));
  const resolutions = new Map(
    report.tokens.map((token) => [key(token), token]),
  );
  for (const override of overrides.tokens) {
    expect(override.reason.trim()).not.toBe("");
    const token = generated.get(key(override));
    expect(token).toBeDefined();
    expect(token).toMatchObject(override.metadata);
    const fields = Object.keys(override.metadata).sort();
    if (override.expected) {
      expect(Object.keys(override.expected).sort()).toEqual(fields);
      expect(resolutions.get(key(override))?.source).not.toBe("local");
      expect(
        resolutions.get(key(override))?.overriddenFields.slice().sort(),
      ).toEqual(fields);
    } else {
      expect(fields).toEqual(["decimals", "name", "symbol"]);
      expect(resolutions.get(key(override))?.source).toBe("local");
    }
  }
});

it("pins each metadata source to an immutable revision and content digest", () => {
  expect(sources.revision).toMatch(/^[a-f0-9]{40}$/);
  expect(new Set(sources.sources.map((source) => source.id)).size).toBe(
    sources.sources.length,
  );
  expect(sources.sources[0].id).toBe("cow");
  for (const source of sources.sources) {
    expect(
      source.url.startsWith(
        `https://raw.githubusercontent.com/cowprotocol/token-lists/${sources.revision}/src/public/`,
      ),
    ).toBe(true);
    expect(source.sha256).toMatch(/^[a-f0-9]{64}$/);
  }
});
