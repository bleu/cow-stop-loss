import { Tooltip, TooltipContent, TooltipTrigger } from "@bleu-fi/ui";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { TooltipProvider } from "@radix-ui/react-tooltip";

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
      <div className="flex items-center gap-x-2">
        {tooltipText && (
          <Tooltip>
            <TooltipContent>{tooltipText}</TooltipContent>
            <TooltipTrigger disabled>
              <QuestionMarkCircledIcon />
            </TooltipTrigger>
          </Tooltip>
        )}
        <span className="font-bold">{label}:</span> {children}
      </div>
    </TooltipProvider>
  );
}
