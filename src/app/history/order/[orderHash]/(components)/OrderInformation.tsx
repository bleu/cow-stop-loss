export function OrderInformation ({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}){
  return (
    <div className="flex">
      <span className="font-bold">{label}:</span> {children}
    </div>
  )
}