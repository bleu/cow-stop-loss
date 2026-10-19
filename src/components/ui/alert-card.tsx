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
      className="pixel-inset flex w-full items-start gap-3 rounded-none border border-border bg-muted/45 px-4 py-3"
      role="alert"
    >
      <div className="mt-0.5 shrink-0">
        <ExclamationTriangleIcon
          className={cn(
            "size-5",
            style === "error" ? "text-destructive" : "text-warning",
          )}
        />
      </div>
      <div>
        <div className="font-semibold text-foreground text-sm">{title}</div>
        <div className="w-full text-xs">{children}</div>
      </div>
    </div>
  );
}
