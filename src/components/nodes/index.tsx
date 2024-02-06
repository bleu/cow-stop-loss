import React, { memo } from "react";
import { Handle, Position } from "reactflow";

interface IBaseNode {
  children: React.ReactNode;
  selected: boolean;
  isEnd?: boolean;
  isStart?: boolean;
}

export function BaseNode({
  children,
  selected,
  isEnd = false,
  isStart = false,
}: IBaseNode) {
  return (
    <div
      className={`px-4 py-2 shadow-md rounded-md bg-white border-2 h-20 w-64 ${
        selected ? "border-teal-500" : "border-stone-400"
      }`}
    >
      {children}
      {!isEnd && (
        <Handle type="source" position={Position.Bottom} className="w-4" />
      )}
      {!isStart && (
        <Handle type="target" position={Position.Top} className="w-4" />
      )}
    </div>
  );
}

export default memo(BaseNode);
