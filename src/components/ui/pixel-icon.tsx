type PixelIconName =
  | "info"
  | "question"
  | "warning"
  | "trash"
  | "settings"
  | "reload"
  | "filter"
  | "wallet"
  | "copy"
  | "check";

const frame =
  "M4 1h8v1h2v2h1v8h-1v2h-2v1H4v-1H2v-2H1V4h1V2h2V1z M4 3v1H3v8h1v1h8v-1h1V4h-1V3H4z";

const paths: Record<PixelIconName, string> = {
  info: `${frame} M7 5h2v2H7z M7 8h2v4H7z`,
  question: `${frame} M6 5h4v1h1v3H9v1H7V8h2V7H7v1H5V6h1z M7 11h2v2H7z`,
  warning:
    "M7 1h2v2h1v2h1v2h1v2h1v2h1v2h1v2H1v-2h1v-2h1V9h1V7h1V5h1V3h1z M7 5v2H6v2H5v2H4v2h8v-2h-1V9h-1V7H9V5z M7 7h2v3H7z M7 11h2v2H7z",
  trash:
    "M6 1h4v2h4v2H2V3h4z M3 6h2v7h6V6h2v8h-1v1H4v-1H3z M6 6h1v6H6z M9 6h1v6H9z",
  settings:
    "M6 0h4v2h2V1h2v2h-1v2h3v6h-3v2h1v2h-2v-1h-2v2H6v-2H4v1H2v-2h1v-2H0V5h3V3H2V1h2v1h2z M6 5v1H5v4h1v1h4v-1h1V6h-1V5z",
  reload:
    "M4 2h7v2h2V1h2v7H8V6h3V4H4v2H2v5h2v2h7v-2h2v2h-2v2H4v-2H2v-2H0V6h2V4h2z",
  filter: "M1 2h14v3h-2v2h-2v2H9v5H7V9H5V7H3V5H1z M3 4v1h2v2h2v2h2V7h2V5h2V4z",
  wallet: "M2 3h11V1H4v2z M1 4h13v2h2v6h-2v3H1z M3 6v7h9v-1H9V6z M11 8v2h3V8z",
  copy: "M1 1h10v3H9V3H3v6h1v2H1z M5 5h10v10H5z M7 7v6h6V7z",
  check: "M1 8h2v2h2v2h2v-2h2V8h2V6h2V4h2v4h-2v2h-2v2H9v2H5v-2H3v-2H1z",
};

export function PixelIcon({
  name,
  className,
}: {
  name: PixelIconName;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      shapeRendering="crispEdges"
      className={className}
    >
      <path d={paths[name]} fillRule="evenodd" />
    </svg>
  );
}
