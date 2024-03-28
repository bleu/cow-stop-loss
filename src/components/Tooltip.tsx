import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@bleu-fi/ui";
import { ExclamationTriangleIcon, InfoCircledIcon, QuestionMarkCircledIcon } from "@radix-ui/react-icons";

export const InfoTooltip = ({ text, link, variant="default" }: { text?: string, link?:string, variant?: "default" | "question" | "error" }) => {
  if (!text) return null;

  function Icon () {
    switch (variant) {
      case "question":
        return <QuestionMarkCircledIcon  />;
      case "error":
        return <ExclamationTriangleIcon />;
      default:
        return <InfoCircledIcon  />;
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger disabled>
          {link ? (
              <a href={link} target="_blank">
                <Icon  />
              </a>
            ) : (
              <Icon  />
            )}
        </TooltipTrigger>
        <TooltipContent className="max-w-56 text-center bg-warning text-background">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};