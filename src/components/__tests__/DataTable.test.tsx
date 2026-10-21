/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { fireEvent, render, screen } from "@testing-library/react";

import { DataTable } from "#/components/data-table/data-table";

function TableView({ fillPanel = false }: { fillPanel?: boolean }) {
  const table = useReactTable({
    data: [{ name: "First order" }],
    columns: [{ accessorKey: "name", header: "Order" }],
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: false,
  });
  return <DataTable table={table} fillPanel={fillPanel} />;
}

function PaginatedTableView({
  fillPanel,
  enableRowSelection,
}: {
  fillPanel: boolean;
  enableRowSelection?: boolean;
}) {
  const table = useReactTable({
    data: [{ name: "First order" }, { name: "Second order" }],
    columns: [{ accessorKey: "name", header: "Order" }],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageIndex: 0, pageSize: 1 },
      rowSelection: { "0": true },
    },
    ...(enableRowSelection === undefined ? {} : { enableRowSelection }),
  });
  return <DataTable table={table} fillPanel={fillPanel} />;
}

test.each([false, true])(
  "preserves pagination sizes and selection counts with fillPanel=%s",
  (fillPanel) => {
    const view = render(<PaginatedTableView fillPanel={fillPanel} />);

    expect(screen.getByText("Page 1 of 2")).toBeVisible();
    expect(screen.getByText("1 of 2 row(s) selected.")).toBeVisible();
    const buttons = [
      "Go to first page",
      "Go to previous page",
      "Go to next page",
      "Go to last page",
    ].map((name) => screen.getByRole("button", { name }));
    for (const button of buttons) {
      expect(button).toHaveClass("size-11", "min-h-11", "min-w-11");
      for (const className of ["lg:size-7", "lg:min-h-7", "lg:min-w-7"]) {
        if (fillPanel) expect(button).toHaveClass(className);
        else expect(button).not.toHaveClass(className);
      }
    }
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).toBeDisabled();
    fireEvent.click(buttons[2]);
    expect(screen.getByText("Page 2 of 2")).toBeVisible();
    expect(screen.getByRole("cell", { name: "Second order" })).toBeVisible();
    expect(buttons[2]).toBeDisabled();
    expect(buttons[3]).toBeDisabled();

    view.rerender(
      <PaginatedTableView fillPanel={fillPanel} enableRowSelection={true} />,
    );
    expect(screen.getByText("1 of 2 row(s) selected.")).toBeVisible();

    view.rerender(
      <PaginatedTableView fillPanel={fillPanel} enableRowSelection={false} />,
    );
    expect(screen.getByText("Page 2 of 2")).toBeVisible();
    expect(screen.queryByText(/row\(s\) selected\./)).not.toBeInTheDocument();
  },
);

test("keeps the default table frame on its bounded scroll viewport", () => {
  render(<TableView />);
  const viewport = screen.getByRole("region", { name: "Table rows" });
  expect(viewport).toHaveClass("pixel-frame", "max-h-96", "overflow-auto");
  expect(viewport).toHaveAttribute("tabindex", "0");
  expect(viewport.parentElement).toHaveClass("space-y-2.5");
  expect(viewport.parentElement).not.toHaveClass("pixel-frame");
  expect(viewport).toContainElement(
    screen.getByRole("cell", { name: "First order" }),
  );
});

test("keeps the fill-panel table frame outside the scroll viewport", () => {
  render(<TableView fillPanel />);
  const viewport = screen.getByRole("region", { name: "Table rows" });
  const frame = viewport.parentElement!;
  expect(viewport).toHaveClass("overflow-auto", "min-h-0", "flex-1");
  expect(viewport).not.toHaveClass("pixel-frame", "max-h-96");
  expect(viewport).toHaveAttribute("tabindex", "0");
  expect(frame).toHaveClass("pixel-frame", "p-0.5", "min-h-0", "flex-1");
  expect(frame).not.toHaveClass("overflow-auto");
  expect(frame.parentElement?.querySelectorAll(".pixel-frame")).toHaveLength(1);
});
