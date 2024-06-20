export default function Page() {
  return (
    <div className="size-full pt-6 px-3 flex text-background gap-6">
      <div className="flex-col space-y-4 bg-foreground rounded-md text-primary-foreground order-2 h-full w-3/5 py-3 pl-3"></div>
      <div className="flex h-full flex-col flex-1 space-y-4"></div>
    </div>
  );
}
