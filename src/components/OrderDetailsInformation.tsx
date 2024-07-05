import { InfoTooltip } from "#/components/Tooltip";

export function OrderDetailsInformation({
  label,
  children,
  tooltipText,
}: {
  label: string;
  children: React.ReactNode;
  tooltipText?: string;
}) {
  return (
    <>
      <div className="gap-x-2 grid grid-cols-5">
        <div className="flex items-center gap-x-1 col-span-1">
          <InfoTooltip text={tooltipText} variant="question" />
          <span className="font-bold">{label}:</span>
        </div>
        <span className="col-span-4">{children}</span>
      </div>
    </>
  );
}
