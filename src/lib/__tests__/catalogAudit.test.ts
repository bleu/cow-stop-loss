import { readFileSync } from "fs";
import path from "path";

import { findTokenOracles, TOKEN_CATALOG } from "../tokenCatalog";

interface Feed {
  path?: string;
  proxyAddress?: string;
}
interface AuditRow extends Feed {
  chainId: number;
  status: string;
  reason: string;
}

const snapshots = JSON.parse(
  readFileSync(path.join(process.cwd(), "scripts/catalog-feeds.json"), "utf8"),
) as Record<string, Feed[]>;
const audit = JSON.parse(
  readFileSync(path.join(process.cwd(), "scripts/catalog-audit.json"), "utf8"),
) as AuditRow[];

function feedKey(chainId: number, feed: Feed): string {
  return `${chainId}:${feed.path ?? ""}:${feed.proxyAddress?.toLowerCase() ?? ""}`;
}

it("accounts for every feed in the source snapshots", () => {
  const sourceKeys = Object.entries(snapshots).flatMap(([chainId, feeds]) =>
    feeds.map((feed) => feedKey(Number(chainId), feed)),
  );
  expect(audit.map((row) => feedKey(row.chainId, row)).sort()).toEqual(
    sourceKeys.sort(),
  );
  for (const row of audit) {
    expect(["included", "excluded", "unresolved"]).toContain(row.status);
    expect(row.reason).toBeTruthy();
  }
});

it("keeps included feed records and token mappings in sync", () => {
  const included = new Set(
    audit
      .filter((row) => row.status === "included")
      .map((row) => `${row.chainId}:${row.proxyAddress?.toLowerCase()}`),
  );
  const mapped = new Set(
    TOKEN_CATALOG.flatMap((token) =>
      Object.values(findTokenOracles(token.chainId, token.address)).map(
        (address) => `${token.chainId}:${address.toLowerCase()}`,
      ),
    ),
  );
  expect([...included].sort()).toEqual([...mapped].sort());
});
