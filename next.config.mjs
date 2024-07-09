/** @type {import('next').NextConfig} */
const moduleExports = {
  experimental: {
    reactCompiler: true,
  },
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET" },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-Requested-With, content-type, Authorization",
          },
        ],
      },
    ];
  },
  images: {
    domains: [
      "assets.coingecko.com",
      "raw.githubusercontent.com",
      "app.stakewise.io",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "app.stakewise.io",
        port: "",
        pathname: "/static/images/currencies/**"
      },
      {
        protocol: "https",
        hostname: "assets.coingecko.com",
        port: "",
        pathname: "/coins/images/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        port: "",
        pathname: "/balancer/frontend-v2/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        port: "",
        pathname: "/trustwallet/assets/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        port: "",
        pathname: "/cowprotocol/token-lists/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        port: "",
        pathname: "/centfinance/assets/**",
      },
      {
        protocol: "https",
        hostname: "gnosis.mypinata.cloud",
        port: "",
        pathname: "/ipfs/**",
      },
    ],
  },
};

export default moduleExports
