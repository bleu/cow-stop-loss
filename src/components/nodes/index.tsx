import React from "react";
import { Handle, Position } from "reactflow";

import { cn } from "#/lib/utils";

export interface IBaseNode {
  children: React.ReactNode;
  selected?: boolean;
  isEnd?: boolean;
  isStart?: boolean;
}

export const defaultNodeProps = { position: { x: 0, y: 0 } };

export function BaseNode({
  children,
  selected,
  isEnd = false,
  isStart = false,
}: IBaseNode) {
  return (
    <div
      className={cn(
        "px-4 py-2 shadow-md rounded-md bg-blue3 border-2 w-64",
        selected ? "border-amber9" : "border-slate6"
      )}
    >
      {children}
      {!isEnd && (
        <Handle
          type="source"
          position={Position.Bottom}
          className={cn(
            "w-2 h-2 rounded-full",
            selected ? "bg-amber9" : "bg-slate6"
          )}
        />
      )}
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          className={cn(
            "w-2 h-2 rounded-full",
            selected ? "bg-amber9" : "bg-slate6"
          )}
        />
      )}
    </div>
  );
}
