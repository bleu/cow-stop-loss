import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { FieldValues } from "react-hook-form";
import { Address } from "viem";

import { buildBlockExplorerAddressURL, truncateAddress } from "#/utils";

import Table from "../Table";

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

        <Table color="blue" shade="darkWithBorder">
          <Table.HeaderRow>
            <Table.HeaderCell classNames="px-4 py-2">
              Gauges Addresses
            </Table.HeaderCell>
          </Table.HeaderRow>
          <Table.Body>
            {defaultValues.gauges.map((gauge: Address) => {
              const contractExplorerUrl = buildBlockExplorerAddressURL({
                chainId: chainId,
                address: gauge,
              })?.url;

              return (
                <Table.BodyRow key={gauge}>
                  <Table.BodyCell padding="px-4 py-2">
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
                  </Table.BodyCell>
                </Table.BodyRow>
              );
            })}
          </Table.Body>
        </Table>
      </div>
    </div>
  );
}
