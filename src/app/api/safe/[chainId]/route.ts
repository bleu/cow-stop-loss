import { isAddress } from "viem";
import { z } from "zod";

import { safeTransactionSchema } from "#/lib/safeApi";
import { isSafeChainId, safeTransactionServices } from "#/lib/safeChains";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chainId: string }> },
) {
  const { chainId } = await params;
  const numericChainId = Number(chainId);
  const service =
    chainId === String(numericChainId) && isSafeChainId(numericChainId)
      ? safeTransactionServices[numericChainId]
      : undefined;
  const query = new URL(request.url).searchParams;
  const safe = query.get("safe");
  const hash = query.get("hash");
  const action = query.get("action");
  const nonce = query.get("nonce");
  if (
    !service ||
    !safe ||
    !isAddress(safe) ||
    !(
      (action === "transaction" && hash && /^0x[0-9a-fA-F]{64}$/.test(hash)) ||
      (action === "replacements" && nonce && /^\d+$/.test(nonce))
    )
  ) {
    return Response.json({ error: "Invalid Safe request" }, { status: 400 });
  }
  try {
    if (action === "replacements") {
      const initial = new URL(
        `${service}/api/v2/safes/${safe}/multisig-transactions/?nonce=${nonce}&executed=true`,
      );
      let next: URL | null = initial;
      const results: z.infer<typeof safeTransactionSchema>[] = [];
      const visited = new Set<string>();
      while (next) {
        if (
          next.origin !== initial.origin ||
          next.pathname !== initial.pathname ||
          next.searchParams.get("nonce") !== nonce ||
          next.searchParams.get("executed") !== "true" ||
          visited.has(next.href) ||
          visited.size >= 20
        )
          throw new Error("Invalid Safe pagination");
        visited.add(next.href);
        const pageResponse = await fetch(next.href, {
          headers: process.env.SAFE_API_KEY
            ? { Authorization: `Bearer ${process.env.SAFE_API_KEY}` }
            : {},
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
          redirect: "error",
        });
        if (!pageResponse.ok) throw new Error("Safe request failed");
        const page = z
          .object({
            next: z.string().nullable(),
            results: z.array(safeTransactionSchema),
          })
          .parse(await pageResponse.json());
        results.push(
          ...page.results.filter(
            (transaction) =>
              transaction.safe.toLowerCase() === safe.toLowerCase() &&
              transaction.nonce === nonce &&
              transaction.isExecuted,
          ),
        );
        next = page.next ? new URL(page.next, initial) : null;
      }
      return Response.json(
        { results },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (!hash) throw new Error("Missing proposal hash");
    const response = await fetch(
      `${service}/api/v2/multisig-transactions/${hash}/`,
      {
        headers: process.env.SAFE_API_KEY
          ? { Authorization: `Bearer ${process.env.SAFE_API_KEY}` }
          : {},
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
        redirect: "error",
      },
    );
    if (!response.ok)
      return Response.json(
        { error: "Safe request failed" },
        { status: response.status === 404 ? 404 : 502 },
      );
    const transaction = safeTransactionSchema.parse(await response.json());
    if (
      transaction.safe.toLowerCase() !== safe.toLowerCase() ||
      transaction.safeTxHash.toLowerCase() !== hash.toLowerCase()
    )
      throw new Error("Unexpected Safe transaction");
    return Response.json(transaction, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Safe request failed" }, { status: 502 });
  }
}
