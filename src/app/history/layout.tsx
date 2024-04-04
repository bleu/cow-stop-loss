import { OrderProvider } from "#/contexts/ordersContext";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <OrderProvider>{children}</OrderProvider>;
}
