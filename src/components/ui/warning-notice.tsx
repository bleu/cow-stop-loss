import type { ReactNode } from "react";

import { PixelIcon } from "./pixel-icon";
import { InfoTooltip } from "./tooltip";

export function WarningNotice({
  children,
  tooltip,
  role = "status",
}: {
  children: ReactNode;
  tooltip?: string;
  role?: "status" | "note";
}) {
  return (
    <aside
      role={role}
      className="flex items-start gap-3 rounded-none border border-amber-500/60 bg-amber-500/15 px-4 py-3 text-sm text-warning"
    >
      <PixelIcon name="warning" className="mt-0.5 size-5 shrink-0" />
      <p className="min-w-0 flex-1 font-medium">{children}</p>
      {tooltip && <InfoTooltip text={tooltip} />}
    </aside>
  );
}
