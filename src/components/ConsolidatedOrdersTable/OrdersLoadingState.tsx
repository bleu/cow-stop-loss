export function OrdersLoadingState() {
  return (
    <div role="status" className="rescue-orders-loading">
      <div aria-hidden="true" className="rescue-orders-loading-cow" />
      <p>Loading stop-loss orders...</p>
      <div aria-hidden="true" className="rescue-orders-loading-dots">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
