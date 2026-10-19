"use client";

import type { ReactNode } from "react";

import { PixelIcon } from "./pixel-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip-primitive";

export const InfoTooltip = ({
  text,
  link,
  variant = "default",
  side = "top",
}: {
  text?: ReactNode;
  link?: string;
  variant?: "default" | "question" | "error";
  side?: "top" | "right" | "bottom" | "left";
}) => {
  if (!text) return null;

  const icon = (
    <PixelIcon
      name={
        variant === "question"
          ? "question"
          : variant === "error"
            ? "warning"
            : "info"
      }
      className="size-4"
    />
  );
  const triggerProps = {
    "aria-label": "More information",
    className:
      "rescue-info-control inline-flex items-center justify-center pixel-control min-h-11 min-w-11 rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          {link ? (
            <a
              {...triggerProps}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {icon}
            </a>
          ) : (
            <button {...triggerProps} type="button">
              {icon}
            </button>
          )}
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent
            side={side}
            collisionPadding={12}
            className="rescue-info-tooltip"
          >
            {text}
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider>
  );
};
