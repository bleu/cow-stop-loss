import Table from "#/components/Table";

function formatDateToLocalDatetime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function TableRowTransaction({ transaction }: { transaction: any }) {
  return (
    <>
      <Table.BodyRow key={transaction.id}>
        <Table.HeaderCell>
          <span className="sr-only"></span>
        </Table.HeaderCell>
        <Table.BodyCell>
          {transaction.blockTimestamp
            ? formatDateToLocalDatetime(
                new Date(transaction.blockTimestamp * 1000)
              )
            : "Pending..."}
        </Table.BodyCell>
      </Table.BodyRow>
    </>
  );
}
