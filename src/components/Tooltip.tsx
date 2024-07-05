"use client";

import { Tooltip, TooltipTrigger } from "@bleu/ui";
import {
  ExclamationTriangleIcon,
  InfoCircledIcon,
  QuestionMarkCircledIcon,
} from "@radix-ui/react-icons";

export const InfoTooltip = ({
  text,
  link,
  variant = "default",
  side = "top",
}: {
  text?: string;
  link?: string;
  variant?: "default" | "question" | "error";
  side?: "top" | "right" | "bottom" | "left";
}) => {
  if (!text) return null;
  if (!text.endsWith(".")) text += ".";

  function Icon() {
    switch (variant) {
      case "question":
        return <QuestionMarkCircledIcon />;
      case "error":
        return <ExclamationTriangleIcon />;
      default:
        return <InfoCircledIcon />;
    }
  }

  return (
    <Tooltip side={side} content={text}>
      <TooltipTrigger>
        {link ? (
          <a href={link} target="_blank">
            <Icon />
          </a>
        ) : (
          <Icon />
        )}
      </TooltipTrigger>
    </Tooltip>
  );
};
