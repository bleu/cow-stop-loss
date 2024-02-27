"use client";

import { ReactFlowProvider } from "reactflow";

import { Board } from "#/components/Board";
import Menu from "#/components/menus";

export default function PlaygroundPage() {
  return (
    <div className="hidden h-full flex-col md:flex text-white">
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
