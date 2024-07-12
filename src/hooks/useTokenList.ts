import useSWR from "swr";

import { IToken } from "#/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useTokenList = (chainId: number) => {
  const { data, error } = useSWR<IToken[]>(`/api/tokens/${chainId}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 3600000, // Refresh every hour
  });

  return {
    tokens: data,
    isLoading: !error && !data,
    isError: error,
  };
};
