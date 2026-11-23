import { existsSync, readFileSync } from "fs";
import path from "path";
import { isAddress, zeroAddress } from "viem";

import { networkFor, networkIdFor } from "../../utils";
import { CHAIN_INFO } from "../chainInfo";
import { COW_API_URL_BY_CHAIN_ID } from "../cowApi/api";
import { getExplorerOrderLink } from "../cowExplorer";
import { CHAINS_ORACLE_ROUTER_FACTORY } from "../oracleRouter";
import {
  publicClientsFromIds,
  RPC_PROVIDERS,
  supportedChainIds,
} from "../publicClients";
import { getSupportedTokens } from "../supportedTokens";
import { findTokenOracles, TOKEN_CATALOG, USD_TOKENS } from "../tokenCatalog";

type Identity = {
  chainId: number;
  address: string;
  localLogo: string;
  logoSource: string;
  logoSha256: string;
};
type MetadataFields = { symbol: string; name: string; decimals: number };
type MetadataOverride = Pick<Identity, "chainId" | "address"> & {
  metadata: Partial<MetadataFields>;
  expected?: Partial<MetadataFields>;
  reason: string;
};
type Feed = { path: string; proxyAddress: string };
type Approval = Feed & {
  chainId: number;
  tokenAddress: string;
  quote: string;
  assetRelationship: string;
  sourceCategorySuitability?: unknown;
  boundedPriceSuitability?: unknown;
};

function read<T>(filename: string): T {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), "scripts", filename), "utf8"),
  ) as T;
}

function key(token: { chainId: number; address: string }): string {
  return `${token.chainId}:${token.address.toLowerCase()}`;
}

const identities = read<{ tokens: Identity[] }>("catalog-identities.json");
const byIdentity = new Map(
  identities.tokens.map((token) => [key(token), token]),
);
const overrides = read<{ tokens: MetadataOverride[] }>(
  "catalog-metadata-overrides.json",
);
const sources = read<{
  revision: string;
  sources: { id: string; url: string; sha256: string }[];
}>("catalog-metadata-sources.json");
const reviewedFeeds = read<Record<string, Feed[]>>("catalog-feeds.json");
const policy = read<{ approvals: Approval[] }>("catalog-policy.json");

it("covers the requested CoW EVM networks and preserves Sepolia", () => {
  expect([...supportedChainIds].sort((a, b) => a - b)).toEqual([
    1, 56, 100, 137, 8453, 9745, 42161, 43114, 59144, 11155111,
  ]);
  expect(
    Object.keys(USD_TOKENS)
      .map(Number)
      .sort((a, b) => a - b),
  ).toEqual([...supportedChainIds].sort((a, b) => a - b));
});

it.each(supportedChainIds)(
  "has complete configuration for chain %s",
  (chainId) => {
    const info = CHAIN_INFO[chainId];
    expect(info.label).toBeTruthy();
    expect(existsSync(path.join(process.cwd(), "public", info.icon))).toBe(
      true,
    );
    expect(publicClientsFromIds[chainId].chain?.id).toBe(chainId);
    expect(new URL(RPC_PROVIDERS[chainId]).protocol).toBe("https:");
    expect(new URL(COW_API_URL_BY_CHAIN_ID[chainId]).protocol).toBe("https:");
    expect(CHAINS_ORACLE_ROUTER_FACTORY[chainId]).toBeDefined();
    expect(Number(networkIdFor(networkFor(chainId)))).toBe(chainId);
    expect(getExplorerOrderLink(chainId, "0x1234")).not.toContain("undefined");
  },
);

it("has unique, valid token contracts and local images", () => {
  const keys = TOKEN_CATALOG.map(
    (token) => `${token.chainId}:${token.address.toLowerCase()}`,
  );
  expect(new Set(keys).size).toBe(keys.length);
  for (const token of TOKEN_CATALOG) {
    expect(supportedChainIds).toContain(token.chainId);
    expect(isAddress(token.address)).toBe(true);
    expect(token.address.toLowerCase()).not.toBe(zeroAddress);
    expect(Number.isInteger(token.decimals)).toBe(true);
    expect(token.decimals).toBeGreaterThanOrEqual(0);
    expect(token.decimals).toBeLessThanOrEqual(36);
    expect(token.symbol).toBeTruthy();
    expect(token.name).toBeTruthy();
    expect(token.logoURI.startsWith("/assets/tokens/")).toBe(true);
    const identity = byIdentity.get(key(token));
    expect(identity?.localLogo).toBe(token.logoURI);
    expect(identity?.logoSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(token.logoURI).toContain(identity!.logoSha256.slice(0, 20));
    expect(new URL(identity!.logoSource).protocol).toBe("https:");
  }
});

it.each(supportedChainIds.filter((id) => id !== 11155111))(
  "offers the exact reviewed sell contracts on mainnet %s",
  async (chainId) => {
    const { sellTokens, buyToken, unavailableReason } =
      getSupportedTokens(chainId);
    expect(unavailableReason).toBeUndefined();
    expect(buyToken.token).toEqual(USD_TOKENS[chainId]);
    const expectedSells = {
      1: [
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "0x514910771af9ca656af840dff83e8264ecf986ca",
        "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
        "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
        "0xc00e94cb662c3520282e6f5717214004a7f26888",
        "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf",
        "0xd533a949740bb3306d119cc777fa900ba034cd52",
        "0xc18360217d8f7ab5e7c516566761ea12ce7f9d72",
        "0x56072c95faa701256059aa122697b133aded9279",
        "0xda5e1988097297dcdc1f90d4dfe7909e847cbef6",
        "0x090185f2135308bad17527004364ebcc2d37e5f6",
        "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e",
        "0x111111111117dc0aa78b770fa6a738034120c302",
        "0x137ddb47ee24eaa998a535ab00378d6bfa84f893",
        "0x18084fba666a33d37592fa2633fd49a74dd93a88",
        "0x320623b8e4ff03373931769a31fc52a4e78b5d70",
        "0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0",
        "0x3845badade8e6dff049820680d1f14bd3903a5d0",
        "0x4d224452801aced8b2f0aebe155379bb5d594381",
        "0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b",
        "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2",
        "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
        "0xa2cd3d43c775978a96bdbf12d733d5a1ed94fb18",
        "0xb50721bcf8d664c30412cfbc6cf7a15145234ad1",
        "0xba100000625a3754423978a60c9317c58a424e3d",
        "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f",
        "0xc944e90c64b2c07662a292be6244bdf05cda44a7",
        "0xd33526068d116ce69f19a9ee46f0bd304f21a51f",
        "0xdefa4e8a7bcba345f687a2f1456f5edd9ce97202",
        "0xe41d2489571d322189246dafa5ebde1f4699f498",
        "0xe6bfd33f52d82ccb5b37e16d3dd81f9ffdabb195",
        "0xf57e7e7c23978c3caec3c3548e3d615c346e79ff",
        "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        "0x418d75f65a02b3d53b2418fb8e1fe493759c7605",
        "0x85f138bfee4ef8e540890cfb48f620571d67eda3",
        "0xd31a59c85ae9d8edefec411d448f90841571b89c",
      ],
      56: [
        "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
        "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
        "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
        "0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd",
        "0xbf5140a22578168fd562dccf235e5d43a02ce9b1",
        "0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63",
        "0xfceb31a79f71ac9cbdcf853519c1b12d379edc46",
        "0xfb6115445bff7b52feb98650c87f44907e58f802",
        "0xaec945e04baf28b135fa7c640f624f8d90f1c3a6",
        "0x3ee2200efb3400fabb9aacf31297cbdd1d435d47",
        "0x000ae314e2a2172a039b26378814c252734f556a",
        "0x570a5d26f7765ecb712c0924e4de545b89fd43df",
        "0x47474747477b199288bf72a1d702f7fe0fb1deea",
        "0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe",
        "0x031b41e504677879370e9dbcf937283a8691fa7f",
        "0x0555e30da8f98308edb960aa94c0db47230d2b9c",
        "0x0d8ce2a99bb6e3b7db580ed848240e4a0f9ae153",
        "0x0eb3a705fc54725037cc9e008bdede697f62f335",
        "0x111111111117dc0aa78b770fa6a738034120c302",
        "0x16939ef78684453bfdfb47825f8a5f714f12623a",
        "0x1ce0c2827e2ef14d5c4f29a091d735a204794041",
        "0x1fa4a73a3f0133f0025378af00236f3abdee5d63",
        "0x2859e4544c4bb03966803b044a93563bd2d0dd4d",
        "0x2ed9a5c8c13b93955103b9a7c167b67ef4d568a3",
        "0x3524fd7488fdb1f4723bbc22c9cbd1bf89f46e3b",
        "0x4338665cbb7b2485a8855a139b75d5e34ab0db94",
        "0x4db5a66e937a9f4473fa95b1caf1d1e1d62e29ea",
        "0x52ce071bd9b1c4b00a0b92d298c512478cad67e8",
        "0x556b60c53fbc1518ad17e03d52e47368dd4d81b3",
        "0x7083609fce4d1d8dc0c979aab8c869ea2c873402",
        "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
        "0x715d400f88c167884bbcc41c5fea407ed4d2f8a0",
        "0x77146784315ba81904d654466968e3a7c196d1f3",
        "0x8ff795a6f4d97e7887c79bea79aba5cc76444adf",
        "0x947950bcc74888a40ffa2593c5798f11fc9124c4",
        "0x96412902aa9aff61e13f085e70d3152c6ef2a817",
        "0x9996d0276612d23b35f90c51ee935520b3d7355b",
        "0xa2b726b1145a4773f68593cf171187d8ebe4d495",
        "0xb1547683da678f2e1f003a780143ec10af8a832b",
        "0xba2ae424d960c26247dd6c32edc70b295c744c43",
        "0xc836d8dc361e44dbe64c4862d55ba041f88ddd39",
        "0xce7de646e7208a4ef112cb6ed5038fa6cc6b12e3",
        "0xf7de7e8a6bd59ed41a4b5fe50278b3b7f31384df",
        "0xfa54ff1a158b5189ebba6ae130ced6bbd3aea76e",
        "0xfd7b3a77848f1c2d67e05e54d78d174a0c850335",
      ],
      100: [
        "0x9c58bacc331c9aa871afd802db6379a98e80cedb",
        "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1",
        "0xe2e73a1c69ecf83f464efce6a5be353a37ca09b2",
        "0xdf613af6b44a31299e48131e9347f034347e2f00",
        "0x4537e328bf7e4efa29d05caea260d7fe26af9d74",
        "0xdf6ff92bfdc1e8be45177dc1f4845d391d3ad8fd",
        "0x712b3d230f3c1c19db860d80619288b1f0bdd0bd",
        "0xfadc59d012ba3c110b08a15b7755a5cb7cbe77d7",
        "0x3a00e08544d589e19a8e7d97d0294331341cdbf6",
        "0x2995d1317dcd4f0ab89f4ae60f3f020a4f17c7ce",
        "0x8e5bbbb09ed1ebde8674cda39a0c169401db4252",
        "0xbf65bfcb5da067446cee6a706ba3fe2fb1a9fdfd",
      ],
      137: [
        "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
        "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39",
        "0xd6df932a45c0f255f85145f286ea0b292b21c90b",
        "0xb33eaad8d922b1083446dc23f610c2567fb5180f",
        "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
        "0x8505b9d2254a7ae468c0e9dd10ccea3a837aef5c",
        "0x172370d5cd63279efa6d502dab29171933a610af",
        "0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7",
        "0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a",
        "0x11cd37bb86f65419713f30673a480ea33c826872",
        "0x1280830f690d0e65195b3c61b028244c3a49f26d",
        "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
        "0x36b77a184be8ee56f5e81c56727b20647a42e28e",
        "0x3cef98bb43d732e2f285ee605a8158cde967d219",
        "0x4257ea7637c355f81616050cbb6a9b709fd72683",
        "0x50b728d8d964fd00c2d0aad81718b71311fef68a",
        "0x5d49c278340655b56609fdf8976eb0612af3a0c3",
        "0x5fe2b58c013d7601147dcdd68c143a77499f5531",
        "0x61bdd9c7d4df4bf47a4508c0c8245505f2af5b7b",
        "0x6f8a06447ff6fcf75d803135a7de15ce88c1d4ec",
        "0x7bb11e7f8b10e9e571e5d8eace04735fdfb2358a",
        "0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3",
        "0x9c2c5fd7b07e95ee044ddeba0e97a665f142394f",
        "0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4",
        "0xb7b31a6bc18e48888545ce79e83e06003be70930",
        "0xbbba073c31bf03b8acf7c28ef0738decf3695683",
        "0xd93f7e271cb87c23aaa73edc008a79646d1f9912",
        "0xecdcb5b88f8e3c15f95c720c51c71c9e2080525d",
        "0xf1938ce12400f9a761084e7a80d37e732a4da056",
      ],
      8453: [
        "0x4200000000000000000000000000000000000006",
        "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b",
        "0x88fb150bdc53a65fe94dea0c9ba0a6daf8c6e196",
        "0x63706e401c06ac8513145b7687a14804d17f814b",
        "0x9e1028f5f1d5ede59748ffcee5532509976840e0",
        "0x940181a94a35a4569e4529a3cdfb74e38fd98631",
        "0x696f9436b67233384889472cd7cd58a6fb5df4f1",
        "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf",
        "0xcbd06e5a2b0c65597161de254aa074e489deb510",
        "0x1a35ee4640b0a3b87705b0a4b45d227ba60ca2ad",
        "0x22e6966b799c4d5b13be962e1d117b56327fda66",
        "0x236aa50979d5f3de3bd1eeb40e81137f22ab794b",
        "0x23ee2343b892b1bb63503a4fabc840e0e2c6810f",
        "0x2da56acb9ea78330f947bd57c54119debda7af71",
        "0x311935cd80b76769bf2ecc9d8ab7635b2139cf82",
        "0x4bfaa776991e85e5f8b1255461cbbd216cfc714f",
        "0x4ed4e862860bed51a9570b96d89af5e1b0efefed",
        "0x6985884c4392d348587b19cb9eaaf157f13271cd",
        "0x7c298664bd6582f6f264c2cb5a4b9cc09b6e3889",
        "0x994ac01750047b9d35431a7ae4ed312ee955e030",
        "0x9eaf8c1e34f05a589eda6bafdf391cf6ad3cb239",
        "0xa88594d404727625a9437c3f886c7643872296ae",
        "0xab36452dbac151be02b16ca17d8919826072f64a",
        "0xacfe6019ed1a7dc6f7b508c02d1b04ec88cc21bf",
        "0xb2000000000000000000008501b13360000cb2ec",
        "0xb358489d5d92641edb4d8ee8063f8005964346ba",
        "0xb4fde59a779991bfb6a52253b51947828b982be3",
        "0xbaa5cc21fd487b8fcc2f632f3f4e8d37262a0842",
        "0xcb17c9db87b595717c857a08468793f5bab6445f",
        "0xcb585250f852c6c6bf90434ab21a00f02833a4af",
        "0xcbada732173e39521cdbe8bf59a6dc85a9fc7b8c",
      ],
      9745: [
        "0x6100e367285b01f48d07953803a2d8dca5d19873",
        "0x76a443768a5e3b8d1aed0105fc250877841deb40",
        "0x9895d81bb462a195b4922ed7de0e3acd007c32cb",
        "0xa3d68b74bf0528fdd07263c60d6488749044914b",
        "0x58538e6a46e07434d7e7375bc268d3cb839c0133",
      ],
      42161: [
        "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
        "0x912ce59144191c1204e64559fe8253a0e49e6548",
        "0xf97f4df75117a78c1a5a0dbb814af92458539fb4",
        "0xba5ddd1f9d7f570dc94a51479a000e3bce967196",
        "0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0",
        "0x354a6da3fcde098f8389cad84b0182725c6c91de",
        "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
        "0x58538e6a46e07434d7e7375bc268d3cb839c0133",
        "0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a",
        "0x18c11fd286c5ec11c3b683caa813b77f5163a122",
        "0x0c880f6761f1af8d9aa9c466984b80dab9a8c9e8",
        "0x11cdb42b0eb46d95f990bedd4695a6e3fa034978",
        "0x1b896893dfc86bb67cf57767298b9073d2c1ba2c",
        "0x3082cc23568ea640225c2467653db90e9250aaa0",
        "0x3e6648c5a70a150a88bce65f4ad4d506fe15d2af",
        "0x40bd670a58238e6e230c430bbb5ce6ec0d40df48",
        "0x539bde0d7dbd336b79148aa742883198bbf60342",
        "0x6c84a8f1c29108f47a79964b5fe888d4f4d0de40",
        "0x7f9fbf9bdd3f4105c478b996b648fe6e828a1e98",
        "0x82e3a8f066a6989666b031d916c43672085b1582",
        "0x9623063377ad1b27544c965ccd7342f7ea7e88c7",
        "0xc87b37a581ec3257b734886d9d3a581f5a9d056c",
        "0xca5ca9083702c56b481d1eec86f1776fdbd2e594",
        "0xcafcd85d8ca7ad1e1c6f82f651fa15e33aefd07b",
        "0xd4d42f0b6def4ce0383636770ef773390d85c61a",
        "0x13ad51ed4f1b7e9dc168d8a00cb3f4ddd85efa60",
        "0x25d887ce7a35172c62febfd67a1856f20faebb00",
        "0x4d1d7134b87490ae5eebdb22a5820d7d0e1980bf",
        "0x4edef400ede5309240814b5fc403f224504604e9",
        "0x5033833c9fe8b9d3e09eed2f73d2aaf7e3872fd1",
        "0x565609faf65b92f7be02468acf86f8979423e514",
        "0x6314c31a7a1652ce482cffe247e9cb7c3f4bb9af",
        "0x6985884c4392d348587b19cb9eaaf157f13271cd",
        "0x7af00405916d823edb1121546efa6f4972b51b84",
        "0x8ea3156f834a0dfc78f1a5304fac2cda676f354c",
        "0x9c1a1c7ba9c2602123fd7ef3eb41a769edf6c53a",
        "0xaafcfd42c9954c6689ef1901e03db742520829c5",
        "0xb74da9fe2f96b9e0a5f4a3cf0b92dd2bec617124",
        "0xcba56cd8216fcbbf3fa6df6137f3147cbca37d60",
        "0xcf79d86b8a830030af6d835737d6eac3be823fd7",
        "0x06bee9e7238a331b68d83df3b5b9b16d5dba83ff",
        "0x23ee2343b892b1bb63503a4fabc840e0e2c6810f",
        "0x41b94c5867f7f6217c9a30520cb3e793b1ee1b97",
      ],
      43114: [
        "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
        "0x63a72806098bd3d9520cc43356dd78afe5d386d9",
        "0xc3048e19e76cb9a3aa9d77d8c03c29fc906e2437",
        "0x5947bb275c521040051d82396192181b413227a3",
        "0x8ebaf22b6f053dffeaf46f4dd9efa95d89ba8580",
        "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab",
        "0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd",
        "0x62edc0692bd897d2295872a9ffcac5425011c661",
        "0x8729438eb15e2c8b576fcc6aecda6a148776c0f5",
        "0x0555e30da8f98308edb960aa94c0db47230d2b9c",
        "0xd1c3f94de7e5b45fa4edbba472491a9f4b166fc4",
        "0x152b9d0fdc40c096757f570a51e494bd4b943e50",
        "0x37b608519f91f70f2eeb0e5ed9af4061722e4f76",
        "0x442f7f22b1ee2c842beaff52880d4573e9201158",
        "0x50b7545627a5162f82a992c33b87adc75187b218",
        "0x8b82a291f83ca07af22120aba21632088fc92931",
        "0x901ee57f7118a7be56ac079cbcda7f22663a3874",
        "0x98443b96ea4b0858fdf3219cd13e98c7a4690588",
        "0x9eaac1b23d935365bd7b542fe22ceee2922f52dc",
        "0xbec243c995409e6520d7c41e404da5deba4b209b",
        "0xf2f13f0b7008ab2fa4a2418f4ccc3684e49d20eb",
      ],
      59144: [
        "0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f",
        "0xa18152629128738a5c081eb226335fed4b9c95e9",
        "0xb5bedd42000b71fdde22d3ee8a79bd49a568fc8f",
        "0xcb598507a524b02d61f8c89ae47cc6076407998b",
        "0x0ece76334fb560f2b1a49a60e38cf726b02203f0",
        "0x1789e0043623282d5dcc7f213d703c6d8bafbb04",
        "0x3aab2285ddcddad8edf438c1bab47e1a9d05a9b4",
      ],
    };
    const addresses = sellTokens.map(({ token }) =>
      token.address.toLowerCase(),
    );
    expect(addresses.sort()).toEqual(
      expectedSells[chainId as keyof typeof expectedSells].sort(),
    );
    expect(new Set(addresses).size).toBe(addresses.length);
    if (chainId === 1) expect(sellTokens.length).toBeGreaterThanOrEqual(5);
    for (const { token } of sellTokens) {
      expect(token.address.toLowerCase()).not.toBe(
        buyToken.token.address.toLowerCase(),
      );
      expect(
        TOKEN_CATALOG.find(
          (known) =>
            known.chainId === chainId && known.address === token.address,
        )?.assetClass,
      ).toBe("volatile");
    }
    if (chainId === 8453)
      expect(sellTokens[0].token.address).toBe(
        "0x4200000000000000000000000000000000000006",
      );
    const Router = CHAINS_ORACLE_ROUTER_FACTORY[chainId];
    for (const sell of sellTokens) {
      const quote = sell.oracles.ETH && buyToken.oracles.ETH ? "ETH" : "USD";
      expect(sell.oracles[quote]).toBeDefined();
      expect(buyToken.oracles[quote]).toBeDefined();
      await expect(
        new Router({
          chainId,
          tokenSell: sell.token,
          tokenBuy: buyToken.token,
        }).findRoute(),
      ).resolves.toEqual({
        tokenSellOracle: sell.oracles[quote],
        tokenBuyOracle: buyToken.oracles[quote],
      });
    }
  },
);

it("pins reviewed underlying-feed approvals and the historical source-category review", () => {
  const approvalKey = (approval: Approval) =>
    `${approval.chainId}:${approval.tokenAddress.toLowerCase()}:${approval.quote}`;
  expect(
    policy.approvals
      .filter(
        ({ assetRelationship }) => assetRelationship === "bridged-underlying",
      )
      .map(approvalKey)
      .sort(),
  ).toEqual([
    "100:0x2995d1317dcd4f0ab89f4ae60f3f020a4f17c7ce:USD",
    "100:0x3a00e08544d589e19a8e7d97d0294331341cdbf6:USD",
    "100:0x4537e328bf7e4efa29d05caea260d7fe26af9d74:USD",
    "100:0x4ecaba5870353805a9f068101a40e0f32ed605c6:USD",
    "100:0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1:USD",
    "100:0x712b3d230f3c1c19db860d80619288b1f0bdd0bd:USD",
    "100:0x8e5bbbb09ed1ebde8674cda39a0c169401db4252:USD",
    "100:0x9c58bacc331c9aa871afd802db6379a98e80cedb:USD",
    "100:0xbf65bfcb5da067446cee6a706ba3fe2fb1a9fdfd:USD",
    "100:0xdf613af6b44a31299e48131e9347f034347e2f00:USD",
    "100:0xdf6ff92bfdc1e8be45177dc1f4845d391d3ad8fd:USD",
    "100:0xe2e73a1c69ecf83f464efce6a5be353a37ca09b2:USD",
    "100:0xfadc59d012ba3c110b08a15b7755a5cb7cbe77d7:USD",
    "137:0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a:USD",
    "137:0x11cd37bb86f65419713f30673a480ea33c826872:USD",
    "137:0x1280830f690d0e65195b3c61b028244c3a49f26d:USD",
    "137:0x172370d5cd63279efa6d502dab29171933a610af:USD",
    "137:0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6:USD",
    "137:0x36b77a184be8ee56f5e81c56727b20647a42e28e:USD",
    "137:0x3cef98bb43d732e2f285ee605a8158cde967d219:USD",
    "137:0x4257ea7637c355f81616050cbb6a9b709fd72683:USD",
    "137:0x50b728d8d964fd00c2d0aad81718b71311fef68a:USD",
    "137:0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39:USD",
    "137:0x5d49c278340655b56609fdf8976eb0612af3a0c3:USD",
    "137:0x5fe2b58c013d7601147dcdd68c143a77499f5531:USD",
    "137:0x61bdd9c7d4df4bf47a4508c0c8245505f2af5b7b:USD",
    "137:0x6f8a06447ff6fcf75d803135a7de15ce88c1d4ec:USD",
    "137:0x7bb11e7f8b10e9e571e5d8eace04735fdfb2358a:USD",
    "137:0x7ceb23fd6bc0add59e62ac25578270cff1b9f619:USD",
    "137:0x8505b9d2254a7ae468c0e9dd10ccea3a837aef5c:USD",
    "137:0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3:USD",
    "137:0x9c2c5fd7b07e95ee044ddeba0e97a665f142394f:USD",
    "137:0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4:USD",
    "137:0xb33eaad8d922b1083446dc23f610c2567fb5180f:USD",
    "137:0xb7b31a6bc18e48888545ce79e83e06003be70930:USD",
    "137:0xbbba073c31bf03b8acf7c28ef0738decf3695683:USD",
    "137:0xd6df932a45c0f255f85145f286ea0b292b21c90b:USD",
    "137:0xd93f7e271cb87c23aaa73edc008a79646d1f9912:USD",
    "137:0xecdcb5b88f8e3c15f95c720c51c71c9e2080525d:USD",
    "137:0xf1938ce12400f9a761084e7a80d37e732a4da056:USD",
    "1:0x137ddb47ee24eaa998a535ab00378d6bfa84f893:USD",
    "1:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599:USD",
    "1:0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0:USD",
    "1:0x418d75f65a02b3d53b2418fb8e1fe493759c7605:USD",
    "1:0x85f138bfee4ef8e540890cfb48f620571d67eda3:USD",
    "1:0xb50721bcf8d664c30412cfbc6cf7a15145234ad1:USD",
    "1:0xd31a59c85ae9d8edefec411d448f90841571b89c:USD",
    "42161:0x06bee9e7238a331b68d83df3b5b9b16d5dba83ff:USD",
    "42161:0x0c880f6761f1af8d9aa9c466984b80dab9a8c9e8:USD",
    "42161:0x11cdb42b0eb46d95f990bedd4695a6e3fa034978:USD",
    "42161:0x13ad51ed4f1b7e9dc168d8a00cb3f4ddd85efa60:USD",
    "42161:0x1b896893dfc86bb67cf57767298b9073d2c1ba2c:USD",
    "42161:0x23ee2343b892b1bb63503a4fabc840e0e2c6810f:USD",
    "42161:0x25d887ce7a35172c62febfd67a1856f20faebb00:USD",
    "42161:0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f:USD",
    "42161:0x354a6da3fcde098f8389cad84b0182725c6c91de:USD",
    "42161:0x3e6648c5a70a150a88bce65f4ad4d506fe15d2af:USD",
    "42161:0x40bd670a58238e6e230c430bbb5ce6ec0d40df48:USD",
    "42161:0x41b94c5867f7f6217c9a30520cb3e793b1ee1b97:USD",
    "42161:0x4d1d7134b87490ae5eebdb22a5820d7d0e1980bf:USD",
    "42161:0x4edef400ede5309240814b5fc403f224504604e9:USD",
    "42161:0x5033833c9fe8b9d3e09eed2f73d2aaf7e3872fd1:USD",
    "42161:0x539bde0d7dbd336b79148aa742883198bbf60342:USD",
    "42161:0x565609faf65b92f7be02468acf86f8979423e514:USD",
    "42161:0x58538e6a46e07434d7e7375bc268d3cb839c0133:USD",
    "42161:0x6314c31a7a1652ce482cffe247e9cb7c3f4bb9af:USD",
    "42161:0x6c84a8f1c29108f47a79964b5fe888d4f4d0de40:USD",
    "42161:0x7af00405916d823edb1121546efa6f4972b51b84:USD",
    "42161:0x7f9fbf9bdd3f4105c478b996b648fe6e828a1e98:USD",
    "42161:0x82e3a8f066a6989666b031d916c43672085b1582:USD",
    "42161:0x8ea3156f834a0dfc78f1a5304fac2cda676f354c:USD",
    "42161:0x9623063377ad1b27544c965ccd7342f7ea7e88c7:USD",
    "42161:0x9c1a1c7ba9c2602123fd7ef3eb41a769edf6c53a:USD",
    "42161:0xaafcfd42c9954c6689ef1901e03db742520829c5:USD",
    "42161:0xb74da9fe2f96b9e0a5f4a3cf0b92dd2bec617124:USD",
    "42161:0xba5ddd1f9d7f570dc94a51479a000e3bce967196:USD",
    "42161:0xc87b37a581ec3257b734886d9d3a581f5a9d056c:USD",
    "42161:0xca5ca9083702c56b481d1eec86f1776fdbd2e594:USD",
    "42161:0xcafcd85d8ca7ad1e1c6f82f651fa15e33aefd07b:USD",
    "42161:0xcba56cd8216fcbbf3fa6df6137f3147cbca37d60:USD",
    "42161:0xcf79d86b8a830030af6d835737d6eac3be823fd7:USD",
    "42161:0xd4d42f0b6def4ce0383636770ef773390d85c61a:USD",
    "42161:0xf97f4df75117a78c1a5a0dbb814af92458539fb4:USD",
    "42161:0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0:USD",
    "43114:0x152b9d0fdc40c096757f570a51e494bd4b943e50:USD",
    "43114:0x37b608519f91f70f2eeb0e5ed9af4061722e4f76:USD",
    "43114:0x442f7f22b1ee2c842beaff52880d4573e9201158:USD",
    "43114:0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab:USD",
    "43114:0x50b7545627a5162f82a992c33b87adc75187b218:USD",
    "43114:0x5947bb275c521040051d82396192181b413227a3:USD",
    "43114:0x63a72806098bd3d9520cc43356dd78afe5d386d9:USD",
    "43114:0x8b82a291f83ca07af22120aba21632088fc92931:USD",
    "43114:0x8ebaf22b6f053dffeaf46f4dd9efa95d89ba8580:USD",
    "43114:0x98443b96ea4b0858fdf3219cd13e98c7a4690588:USD",
    "43114:0x9eaac1b23d935365bd7b542fe22ceee2922f52dc:USD",
    "43114:0xbec243c995409e6520d7c41e404da5deba4b209b:USD",
    "43114:0xc3048e19e76cb9a3aa9d77d8c03c29fc906e2437:USD",
    "43114:0xf2f13f0b7008ab2fa4a2418f4ccc3684e49d20eb:USD",
    "56:0x0555e30da8f98308edb960aa94c0db47230d2b9c:USD",
    "56:0x0d8ce2a99bb6e3b7db580ed848240e4a0f9ae153:USD",
    "56:0x0eb3a705fc54725037cc9e008bdede697f62f335:USD",
    "56:0x111111111117dc0aa78b770fa6a738034120c302:USD",
    "56:0x16939ef78684453bfdfb47825f8a5f714f12623a:USD",
    "56:0x1ce0c2827e2ef14d5c4f29a091d735a204794041:USD",
    "56:0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe:USD",
    "56:0x1fa4a73a3f0133f0025378af00236f3abdee5d63:USD",
    "56:0x2170ed0880ac9a755fd29b2688956bd959f933f8:USD",
    "56:0x2859e4544c4bb03966803b044a93563bd2d0dd4d:USD",
    "56:0x2ed9a5c8c13b93955103b9a7c167b67ef4d568a3:USD",
    "56:0x3524fd7488fdb1f4723bbc22c9cbd1bf89f46e3b:USD",
    "56:0x3ee2200efb3400fabb9aacf31297cbdd1d435d47:USD",
    "56:0x4338665cbb7b2485a8855a139b75d5e34ab0db94:USD",
    "56:0x47474747477b199288bf72a1d702f7fe0fb1deea:USD",
    "56:0x4db5a66e937a9f4473fa95b1caf1d1e1d62e29ea:USD",
    "56:0x52ce071bd9b1c4b00a0b92d298c512478cad67e8:USD",
    "56:0x556b60c53fbc1518ad17e03d52e47368dd4d81b3:USD",
    "56:0x55d398326f99059ff775485246999027b3197955:USD",
    "56:0x570a5d26f7765ecb712c0924e4de545b89fd43df:USD",
    "56:0x7083609fce4d1d8dc0c979aab8c869ea2c873402:USD",
    "56:0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c:USD",
    "56:0x715d400f88c167884bbcc41c5fea407ed4d2f8a0:USD",
    "56:0x8ff795a6f4d97e7887c79bea79aba5cc76444adf:USD",
    "56:0x947950bcc74888a40ffa2593c5798f11fc9124c4:USD",
    "56:0x96412902aa9aff61e13f085e70d3152c6ef2a817:USD",
    "56:0x9996d0276612d23b35f90c51ee935520b3d7355b:USD",
    "56:0xa2b726b1145a4773f68593cf171187d8ebe4d495:USD",
    "56:0xb1547683da678f2e1f003a780143ec10af8a832b:USD",
    "56:0xba2ae424d960c26247dd6c32edc70b295c744c43:USD",
    "56:0xbf5140a22578168fd562dccf235e5d43a02ce9b1:USD",
    "56:0xc836d8dc361e44dbe64c4862d55ba041f88ddd39:USD",
    "56:0xce7de646e7208a4ef112cb6ed5038fa6cc6b12e3:USD",
    "56:0xf7de7e8a6bd59ed41a4b5fe50278b3b7f31384df:USD",
    "56:0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd:USD",
    "56:0xfa54ff1a158b5189ebba6ae130ced6bbd3aea76e:USD",
    "56:0xfb6115445bff7b52feb98650c87f44907e58f802:USD",
    "56:0xfd7b3a77848f1c2d67e05e54d78d174a0c850335:USD",
    "59144:0x0ece76334fb560f2b1a49a60e38cf726b02203f0:USD",
    "59144:0x1789e0043623282d5dcc7f213d703c6d8bafbb04:USD",
    "59144:0x3aab2285ddcddad8edf438c1bab47e1a9d05a9b4:USD",
    "59144:0xa18152629128738a5c081eb226335fed4b9c95e9:USD",
    "59144:0xb5bedd42000b71fdde22d3ee8a79bd49a568fc8f:USD",
    "59144:0xcb598507a524b02d61f8c89ae47cc6076407998b:USD",
    "8453:0x1a35ee4640b0a3b87705b0a4b45d227ba60ca2ad:USD",
    "8453:0x22e6966b799c4d5b13be962e1d117b56327fda66:USD",
    "8453:0x23ee2343b892b1bb63503a4fabc840e0e2c6810f:USD",
    "8453:0x2da56acb9ea78330f947bd57c54119debda7af71:USD",
    "8453:0x311935cd80b76769bf2ecc9d8ab7635b2139cf82:USD",
    "8453:0x63706e401c06ac8513145b7687a14804d17f814b:USD",
    "8453:0x7c298664bd6582f6f264c2cb5a4b9cc09b6e3889:USD",
    "8453:0x88fb150bdc53a65fe94dea0c9ba0a6daf8c6e196:USD",
    "8453:0x994ac01750047b9d35431a7ae4ed312ee955e030:USD",
    "8453:0x9e1028f5f1d5ede59748ffcee5532509976840e0:USD",
    "8453:0x9eaf8c1e34f05a589eda6bafdf391cf6ad3cb239:USD",
    "8453:0xab36452dbac151be02b16ca17d8919826072f64a:USD",
    "8453:0xb2000000000000000000008501b13360000cb2ec:USD",
    "8453:0xb358489d5d92641edb4d8ee8063f8005964346ba:USD",
    "8453:0xb4fde59a779991bfb6a52253b51947828b982be3:USD",
    "8453:0xbaa5cc21fd487b8fcc2f632f3f4e8d37262a0842:USD",
    "8453:0xcb17c9db87b595717c857a08468793f5bab6445f:USD",
    "8453:0xcb585250f852c6c6bf90434ab21a00f02833a4af:USD",
    "8453:0xcbada732173e39521cdbe8bf59a6dc85a9fc7b8c:USD",
    "9745:0x58538e6a46e07434d7e7375bc268d3cb839c0133:USD",
    "9745:0x76a443768a5e3b8d1aed0105fc250877841deb40:USD",
    "9745:0x9895d81bb462a195b4922ed7de0e3acd007c32cb:USD",
    "9745:0xa3d68b74bf0528fdd07263c60d6488749044914b:USD",
  ]);
  expect(
    policy.approvals
      .filter(({ sourceCategorySuitability }) => sourceCategorySuitability)
      .map(approvalKey),
  ).toEqual(["100:0x9c58bacc331c9aa871afd802db6379a98e80cedb:USD"]);
  for (const approval of policy.approvals.filter(
    ({ boundedPriceSuitability }) => boundedPriceSuitability,
  ))
    expect(approval.tokenAddress).toBe(
      USD_TOKENS[
        approval.chainId as keyof typeof USD_TOKENS
      ].address.toLowerCase(),
    );
});

it("uses the direct Ethereum APE/USD feed", () => {
  expect(
    findTokenOracles(1, "0x4d224452801aced8b2f0aebe155379bb5d594381"),
  ).toEqual({ USD: "0xd10abbc76679a20055e167bb80a24ac851b37056" });
});

it("preserves Sepolia's separate WETH-only test route", () => {
  expect(
    getSupportedTokens(11155111).sellTokens.map(({ token }) =>
      token.address.toLowerCase(),
    ),
  ).toEqual(["0xfff9976782d46cc05630d1f6ebab18b2324d6b14"]);
});

it("keeps the designated buy token contracts unchanged", () => {
  expect(
    Object.fromEntries(
      Object.entries(USD_TOKENS).map(([chainId, token]) => [
        chainId,
        token.address.toLowerCase(),
      ]),
    ),
  ).toEqual({
    1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    56: "0x55d398326f99059ff775485246999027b3197955",
    100: "0x4ecaba5870353805a9f068101a40e0f32ed605c6",
    137: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    8453: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    9745: "0x2d661c89d812261039af9764eceaaee884f5f67f",
    42161: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    43114: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
    59144: "0x176211869ca2b568f2a7d4ee941e073a821ee1ff",
    11155111: "0xbe72e441bf55620febc26715db68d3494213d8cb",
  });
});

it("does not expose feeds for metadata-only, unknown or cross-chain addresses", () => {
  const metadataOnly = "0x0555e30da8f98308edb960aa94c0db47230d2b9c";
  expect(
    TOKEN_CATALOG.find(
      (token) => token.chainId === 8453 && token.address === metadataOnly,
    ),
  ).toMatchObject({
    chainId: 8453,
    symbol: "WBTC",
  });
  expect(findTokenOracles(8453, metadataOnly.toUpperCase())).toEqual({});
  expect(findTokenOracles(8453, metadataOnly)).toEqual({});
  expect(
    findTokenOracles(8453, "0x0000000000000000000000000000000000000001"),
  ).toEqual({});
  expect(findTokenOracles(1, USD_TOKENS[8453].address)).toEqual({});
});

it("keeps reviewed identities without handwritten display metadata", () => {
  expect(identities.tokens.map(key).sort()).toEqual(
    TOKEN_CATALOG.map(key).sort(),
  );
  const imageHashes = new Map<string, string>();
  for (const identity of identities.tokens) {
    expect(identity).not.toHaveProperty("symbol");
    expect(identity).not.toHaveProperty("name");
    expect(identity).not.toHaveProperty("decimals");
    const existing = imageHashes.get(identity.localLogo);
    if (existing !== undefined) expect(identity.logoSha256).toBe(existing);
    imageHashes.set(identity.localLogo, identity.logoSha256);
  }
});

it("keeps local metadata only for reviewed gaps and field corrections", () => {
  const generated = new Map(TOKEN_CATALOG.map((token) => [key(token), token]));
  expect(new Set(overrides.tokens.map(key)).size).toBe(overrides.tokens.length);
  for (const override of overrides.tokens) {
    expect(override.reason.trim()).not.toBe("");
    expect(generated.get(key(override))).toMatchObject(override.metadata);
    const fields = Object.keys(override.metadata).sort();
    if (override.expected) {
      expect(Object.keys(override.expected).sort()).toEqual(fields);
      for (const field of ["symbol", "name", "decimals"] as const) {
        if (override.metadata[field] !== undefined)
          expect(override.metadata[field]).not.toBe(override.expected[field]);
      }
    } else {
      expect(fields).toEqual(["decimals", "name", "symbol"]);
    }
  }
});

it("pins external metadata to an immutable revision and content digests", () => {
  expect(sources.revision).toMatch(/^[a-f0-9]{40}$/);
  expect(new Set(sources.sources.map((source) => source.id)).size).toBe(
    sources.sources.length,
  );
  expect(sources.sources[0].id).toBe("cow");
  for (const source of sources.sources) {
    expect(
      source.url.startsWith(
        `https://raw.githubusercontent.com/cowprotocol/token-lists/${sources.revision}/src/public/`,
      ),
    ).toBe(true);
    expect(source.sha256).toMatch(/^[a-f0-9]{64}$/);
  }
});

it("exposes only feeds with exact reviewed rows and token approvals", () => {
  const reviewed = new Set<string>();
  for (const [chainId, feeds] of Object.entries(reviewedFeeds)) {
    expect(supportedChainIds.map(String)).toContain(chainId);
    const rows = feeds.map(
      (feed) => `${feed.path}:${feed.proxyAddress.toLowerCase()}`,
    );
    expect(new Set(rows).size).toBe(rows.length);
    for (const feed of feeds) {
      expect(feed.path.trim()).not.toBe("");
      expect(isAddress(feed.proxyAddress)).toBe(true);
      reviewed.add(`${chainId}:${feed.proxyAddress.toLowerCase()}`);
    }
  }
  for (const token of TOKEN_CATALOG) {
    for (const [quote, proxy] of Object.entries(
      findTokenOracles(token.chainId, token.address),
    )) {
      expect(reviewed.has(`${token.chainId}:${proxy.toLowerCase()}`)).toBe(
        true,
      );
      expect(
        policy.approvals.some(
          (approval) =>
            approval.chainId === token.chainId &&
            approval.tokenAddress.toLowerCase() ===
              token.address.toLowerCase() &&
            approval.quote === quote &&
            approval.proxyAddress.toLowerCase() === proxy.toLowerCase() &&
            reviewedFeeds[String(token.chainId)].some(
              (feed) =>
                feed.path === approval.path &&
                feed.proxyAddress.toLowerCase() === proxy.toLowerCase(),
            ),
        ),
      ).toBe(true);
    }
  }
});
