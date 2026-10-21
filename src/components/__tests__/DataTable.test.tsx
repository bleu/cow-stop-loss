/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";

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
