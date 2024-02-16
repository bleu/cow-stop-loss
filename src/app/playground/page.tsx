"use client";

import { ReactFlowProvider } from "reactflow";

import { Board } from "#/components/Board";
import Menu from "#/components/menus";
import { Separator } from "#/components/ui/separator";

export default function PlaygroundPage() {
  return (
    <div className="hidden h-full flex-col md:flex text-white">
      <div className="container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
        <h2 className="text-lg font-semibold">Stop Loss</h2>
      </div>
      <Separator />
      <ReactFlowProvider>
        <div className="container size-full py-6">
          <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_300px]">
            <div className="hidden flex-col space-y-4 sm:flex md:order-2">
              <Menu />
            </div>
            <div className="md:order-1">
              <div className="flex h-full flex-col space-y-4">
                <div className="h-full">
                  <Board />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ReactFlowProvider>
    </div>
  );
}
