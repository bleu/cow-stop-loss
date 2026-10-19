import HomePage from "#/app/app/page";

export default function Page(_props: {
  params: { chainId: number; safeAddress: string };
}) {
  return <HomePage />;
}
