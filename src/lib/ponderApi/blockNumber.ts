// @ts-ignore
import parsePrometeusText from "parse-prometheus-text-format";

import { networkFor } from "#/utils";
import { NEXT_PUBLIC_API_URL } from ".";

export async function getBlockNumberFromPrometheusMetrics(chainId: number) {
  const rawMetricsData = await fetch(NEXT_PUBLIC_API_URL + "/metrics").then(
    (res) => res.text(),
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metrics = parsePrometeusText(rawMetricsData) as Record<string, any>;

  const latestBlockNumber = Object.values(metrics)
    .find(({ name }) => name === "ponder_realtime_latest_block_number")
    ?.["metrics"]?.find(
      // @ts-ignore
      ({ labels }) => labels.network === networkFor(chainId),
    )?.value;

  if (!latestBlockNumber) return undefined;

  return Number(latestBlockNumber);
}
