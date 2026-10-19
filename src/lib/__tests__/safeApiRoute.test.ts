import { GET } from "#/app/api/safe/[chainId]/route";
import { safePrepared, safeProposalId } from "#/test/fixtures/safePlacement";

afterEach(() => jest.restoreAllMocks());

test("rejects inherited chain names before an upstream request", async () => {
  const fetch = jest.spyOn(global, "fetch");
  const response = await GET(
    new Request(
      `https://app.test/api/safe/constructor?action=transaction&safe=${safePrepared.account}&hash=${safeProposalId}`,
    ),
    { params: Promise.resolve({ chainId: "constructor" }) },
  );
  expect(response.status).toBe(400);
  expect(fetch).not.toHaveBeenCalled();
});

test("reads all pages of executed same-nonce replacements", async () => {
  const first = `https://api.safe.global/tx-service/eth/api/v2/safes/${safePrepared.account}/multisig-transactions/?nonce=7&executed=true`;
  const second = `${first}&offset=100`;
  const urls: string[] = [];
  jest.spyOn(global, "fetch").mockImplementation(async (url) => {
    urls.push(String(url));
    return new Response(
      JSON.stringify({
        next: String(url) === first ? second : null,
        results:
          String(url) === first
            ? []
            : [
                {
                  safe: safePrepared.account,
                  safeTxHash: safeProposalId,
                  nonce: "7",
                  isExecuted: true,
                  isSuccessful: false,
                  transactionHash: `0x${"ab".repeat(32)}`,
                },
              ],
      }),
    );
  });
  const response = await GET(
    new Request(
      `https://app.test/api/safe/1?action=replacements&safe=${safePrepared.account}&nonce=7`,
    ),
    { params: Promise.resolve({ chainId: "1" }) },
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    results: [{ safeTxHash: safeProposalId, isExecuted: true }],
  });
  expect(urls).toEqual([first, second]);
});

test("reads a proposal through the fixed chain service without exposing its API key", async () => {
  const previous = process.env.SAFE_API_KEY;
  process.env.SAFE_API_KEY = "test-server-key";
  let upstream: { url: string; authorization: string | null } | undefined;
  jest.spyOn(global, "fetch").mockImplementation(async (url, init) => {
    upstream = {
      url: String(url),
      authorization: new Headers(init?.headers).get("Authorization"),
    };
    return new Response(
      JSON.stringify({
        safe: safePrepared.account,
        safeTxHash: safeProposalId,
        nonce: "7",
        isExecuted: false,
        isSuccessful: null,
        transactionHash: null,
      }),
    );
  });
  try {
    const response = await GET(
      new Request(
        `https://app.test/api/safe/1?action=transaction&safe=${safePrepared.account}&hash=${safeProposalId}`,
      ),
      { params: Promise.resolve({ chainId: "1" }) },
    );
    expect({
      upstream,
      status: response.status,
      data: await response.json(),
    }).toMatchObject({
      upstream: {
        url: `https://api.safe.global/tx-service/eth/api/v2/multisig-transactions/${safeProposalId}/`,
        authorization: "Bearer test-server-key",
      },
      status: 200,
      data: { safeTxHash: safeProposalId, nonce: "7" },
    });
  } finally {
    if (previous === undefined) delete process.env.SAFE_API_KEY;
    else process.env.SAFE_API_KEY = previous;
  }
});
