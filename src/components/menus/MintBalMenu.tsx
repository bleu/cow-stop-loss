import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@bleu-fi/ui";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { FieldValues } from "react-hook-form";
import { Address } from "viem";

import { buildBlockExplorerAddressURL, truncateAddress } from "#/utils";

export function MintBalMenu({
  defaultValues,
}: {
  id: string;
  defaultValues: FieldValues;
}) {
  const {
    safe: { chainId },
  } = useSafeAppsSDK();
  return (
    <div className="m-2 w-full max-h-[39rem] overflow-y-scroll">
      <div className="flex flex-col w-full gap-y-2 mt-2">
        <span className="text-md font-bold mb-2">BAL Mint Hook</span>

        <Table color="blue">
          <TableHeader>
            <TableCell>Gauges Addresses</TableCell>
          </TableHeader>
          <TableBody>
            {defaultValues.gauges.map((gauge: Address) => {
              const contractExplorerUrl = buildBlockExplorerAddressURL({
                chainId: chainId,
                address: gauge,
              })?.url;

              return (
                <TableRow key={gauge}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {truncateAddress(gauge)}
                      <a
                        target="_blank"
                        href={contractExplorerUrl}
                        className="text-slate12"
                      >
                        <ArrowTopRightIcon
                          className="hover:text-amber9"
                          width={10}
                          height={10}
                        />
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
