import { IStopLossRecipeData } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { TokenInfo } from "../TokenInfo";
import { calculateAmounts } from "@/lib/calculateAmounts";
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";

export function StopLossRecipeMenu({ data }: { data: IStopLossRecipeData }) {
  const [sellAmount, buyAmount] = calculateAmounts(data);
  const {
    safe: { chainId },
  } = useSafeAppsSDK();
  return (
    <div>
      <Tabs className="h-full overscroll-auto" defaultValue="preview">
        <TabsList className="flex w-full">
          <TabsTrigger value="preview" className="w-full" defaultChecked>
            Preview
          </TabsTrigger>
          <TabsTrigger value="detailed" className="w-full">
            Detailed
          </TabsTrigger>
        </TabsList>
        <TabsContent value="preview">
          <div className="flex flex-col gap-y-2">
            <div className="flex flex-row gap-x-2 justify-between">
              <span>Condition:</span>
              <span>
                {data.strikePrice} {data.tokenSell.symbol} /
                {data.tokenBuy.symbol}
              </span>
            </div>
            <div className="flex flex-row gap-x-2 justify-between items-center">
              <span>Sell ({data.isSellOrder ? "exact" : "max"}):</span>
              <TokenInfo
                id={data.tokenSell.address}
                symbol={data.tokenSell.symbol}
                amount={sellAmount}
                chainId={chainId}
              />
            </div>
            <div className="flex flex-row gap-x-2 justify-between items-center overscroll-auto">
              <span>Buy ({data.isSellOrder ? "min" : "exact"}):</span>
              <TokenInfo
                id={data.tokenBuy.address}
                symbol={data.tokenBuy.symbol}
                amount={buyAmount}
                chainId={chainId}
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="detailed">
          <div className="flex flex-col gap-y-2">
            {Object.keys(data).map((key) => {
              if (key === "tokenSell" || key === "tokenBuy") {
                return Object.keys(data[key]).map((subkey) => {
                  return (
                    <div key={subkey}>
                      {/* @ts-ignore */}
                      {key} {subkey}: {String(data[key][subkey])}
                    </div>
                  );
                });
              }

              return (
                <div key={key}>
                  {/* @ts-ignore */}
                  {key}: {String(data[key])}
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
