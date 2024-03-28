import { Tooltip, TooltipContent, TooltipTrigger } from "@bleu-fi/ui";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { TooltipProvider } from "@radix-ui/react-tooltip";

const InfoTooltip = ({ text }: { text?: string }) => {
  if (!text) return null;

  return (
    <Tooltip>
      <TooltipTrigger disabled>
        <QuestionMarkCircledIcon />
      </TooltipTrigger>
      <TooltipContent className="max-w-56 text-center bg-warning text-background">
        {text}
      </TooltipContent>
    </Tooltip>
  );
};

export function OrderInformation({
  label,
  children,
  tooltipText,
}: {
  label: string;
  children: React.ReactNode;
  tooltipText?: string;
}) {
  return (
    <TooltipProvider>
      <div className="gap-x-2 grid grid-cols-5">
        <div className="flex items-center gap-x-1 col-span-1">
          <InfoTooltip text={tooltipText} />
          <span className="font-bold">{label}:</span>
        </div>
        <span className="col-span-4">
          {children}
        </span>
      </div>
    </TooltipProvider>
  );
}
