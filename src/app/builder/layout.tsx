import { BuilderContextProvider } from "#/contexts/builder";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <BuilderContextProvider>{children}</BuilderContextProvider>;
}
