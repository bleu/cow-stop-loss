import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { TokenBalance } from "@safe-global/safe-apps-sdk";
import { useEffect, useState } from "react";
import { Address } from "viem";

export function useSafeBalances(): {
  assets: TokenBalance[];
  loaded: boolean;
  fetchBalance: (token: Address) => string;
} {
  const { sdk } = useSafeAppsSDK();

  const [assets, setAssets] = useState<TokenBalance[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchBalance = (token: Address) => {
    return (
      assets.find((asset) => asset.tokenInfo.address === token)?.balance || "0"
    );
  };

  useEffect(() => {
    async function loadBalances() {
      const balances = await sdk.safe.experimental_getBalances();

      setAssets(
        balances.items.filter(
          (item) =>
            parseInt(item.balance) > 0 && item.tokenInfo.type === "ERC20"
        )
      );
      setLoaded(true);
    }

    loadBalances();
  }, [sdk]);

  return { assets, loaded, fetchBalance };
}
