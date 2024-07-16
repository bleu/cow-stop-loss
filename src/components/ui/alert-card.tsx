import { cn } from "@bleu/ui";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

export function AlertCard({
  title,
  style,
  children,
}: {
  style: "error" | "warning";
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="flex w-full justify-center rounded-lg bg-background/70 px-4 py-2 space-x-4"
      role="alert"
    >
      <div className="my-auto">
        <ExclamationTriangleIcon
          className={cn(
            "w-6 h-6",
            style === "error" ? "text-destructive" : "text-highlight",
          )}
        />
      </div>
      <div>
        <div className="font-bold text-sand12 text-base">{title}</div>
        <div className="w-full text-xs">{children}</div>
      </div>
    </div>
  );
}
