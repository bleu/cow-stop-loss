import { cn } from "@bleu-fi/ui";
import React from "react";

import { Handle } from "../Handle";

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
        "px-4 py-2 shadow-md border-2 w-64 bg-foreground rounded-md text-primary-foreground transition-colors",
        selected
          ? "border-highlight"
          : "border-foreground hover:border-highlight"
      )}
    >
      {children}
      {!isEnd && <Handle type="source" />}
      {!isStart && <Handle type="target" />}
    </div>
  );
}
