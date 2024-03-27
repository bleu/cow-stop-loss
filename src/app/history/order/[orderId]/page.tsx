export default function OrderPage({
  params,
}: {
  params: {
    orderId: string
  };
}
){
  return (
    <div className="flex w-full justify-center">
      {params.orderId}
    </div>
  )
}