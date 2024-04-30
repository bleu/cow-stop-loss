import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@bleu-fi/ui";
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger disabled>
          {link ? (
            <a href={link} target="_blank">
              <Icon />
            </a>
          ) : (
            <Icon />
          )}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-72 text-center bg-warning text-background"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
