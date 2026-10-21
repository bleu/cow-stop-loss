import {
  type Address,
  concatHex,
  encodeAbiParameters,
  type Hex,
  keccak256,
  parseAbiParameters,
  stringToHex,
} from "viem";

import { decodeStopLossStaticInput } from "./staticInputDecoder";

export function stopLossScheduleId(
  funder: Address,
  handler: Address,
  owner: Address,
  salt: Hex,
) {
  return keccak256(
    encodeAbiParameters(
      parseAbiParameters("address, address, address, bytes32"),
      [funder, handler, owner, salt],
    ),
  );
}

export function conditionalOrderHash(
  handler: Address,
  salt: Hex,
  staticInput: Hex,
) {
  return keccak256(
    encodeAbiParameters(
      parseAbiParameters("(address handler, bytes32 salt, bytes staticInput)"),
      [{ handler, salt, staticInput }],
    ),
  );
}

export function cowOrderDigest(staticInput: Hex, domainSeparator: Hex) {
  const order = decodeStopLossStaticInput(staticInput);
  const typeHash = keccak256(
    stringToHex(
      "Order(address sellToken,address buyToken,address receiver,uint256 sellAmount,uint256 buyAmount,uint32 validTo,bytes32 appData,uint256 feeAmount,string kind,bool partiallyFillable,string sellTokenBalance,string buyTokenBalance)",
    ),
  );
  const erc20Balance = keccak256(stringToHex("erc20"));
  const structHash = keccak256(
    encodeAbiParameters(
      parseAbiParameters(
        "bytes32,address,address,address,uint256,uint256,uint32,bytes32,uint256,bytes32,bool,bytes32,bytes32",
      ),
      [
        typeHash,
        order.sellToken,
        order.buyToken,
        order.receiver,
        order.sellAmount,
        order.buyAmount,
        Number(order.validTo),
        order.appData,
        BigInt(0),
        keccak256(stringToHex(order.isSellOrder ? "sell" : "buy")),
        order.isPartiallyFillable,
        erc20Balance,
        erc20Balance,
      ],
    ),
  );
  return keccak256(concatHex(["0x1901", domainSeparator, structHash]));
}
