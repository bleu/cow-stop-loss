import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import cn from "clsx";

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
      className="w-full justify-center rounded-lg bg-background/70  px-4 py-2"
      role="alert"
    >
      <div className="w-full flex gap-1 items-center">
        <ExclamationTriangleIcon
          className={cn(
            "w-6 h-6",
            style === "error" ? "text-destructive" : "text-highlight",
          )}
        />
        <div className="font-bold text-sand12 px-4 py-2 text-base">{title}</div>
      </div>
      <div className="w-full text-xs">{children}</div>
    </div>
  );
}
