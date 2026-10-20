export type PixelIconName =
  | "external-link"
  | "arrow-left"
  | "arrow-right"
  | "chevron-left"
  | "chevron-right"
  | "chevron-up"
  | "chevron-down"
  | "chevrons-left"
  | "chevrons-right"
  | "sun"
  | "moon"
  | "github"
  | "discord"
  | "play"
  | "pause"
  | "close"
  | "check-circle"
  | "cancel-circle"
  | "clock"
  | "sort"
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
  "external-link":
    "M8 1h7v7h-2V5h-1v1h-1v1h-1v1H9v1H8v1H6V8h1V7h1V6h1V5h1V4h1V3H8z M1 4h5v2H3v7h7v-3h2v5H1z",
  "arrow-left":
    "M6 2h2v2H6v2H4v1h11v2H4v1h2v2h2v2H6v-2H4v-2H2V9H1V7h1V6h2V4h2z",
  "arrow-right":
    "M8 2h2v2h2v2h2v1h1v2h-1v1h-2v2h-2v2H8v-2h2v-2h2V9H1V7h11V6h-2V4H8z",
  "chevron-left": "M9 2h3v2h-2v2H8v4h2v2h2v2H9v-2H7v-2H5V6h2V4h2z",
  "chevron-right": "M4 2h3v2h2v2h2v4H9v2H7v2H4v-2h2v-2h2V6H6V4H4z",
  "chevron-up": "M6 4h4v2h2v2h2v3h-2V9h-2V7H6v2H4v2H2V8h2V6h2z",
  "chevron-down": "M2 5h2v2h2v2h4V7h2V5h2v3h-2v2h-2v2H6v-2H4V8H2z",
  "chevrons-left":
    "M5 2h2v2H5v2H3v4h2v2h2v2H5v-2H3v-2H1V6h2V4h2z M12 2h2v2h-2v2h-2v4h2v2h2v2h-2v-2h-2v-2H8V6h2V4h2z",
  "chevrons-right":
    "M2 2h2v2h2v2h2v4H6v2H4v2H2v-2h2v-2h2V6H4V4H2z M9 2h2v2h2v2h2v4h-2v2h-2v2H9v-2h2v-2h2V6h-2V4H9z",
  sun: "M7 0h2v3H7z M7 13h2v3H7z M0 7h3v2H0z M13 7h3v2h-3z M2 2h2v2H2z M12 2h2v2h-2z M2 12h2v2H2z M12 12h2v2h-2z M6 4h4v1h1v1h1v4h-1v1h-1v1H6v-1H5v-1H4V6h1V5h1z M6 6v4h4V6z",
  moon: "M6 1h4v2H8v4h1v2h2v1h4v3h-2v1h-2v1H5v-1H3v-2H2V5h1V3h2V2h1z M5 4v1H4v6h1v1h1v1h5v-1h1v-1h-2v-1H8V8H7V6H6V4z",
  github:
    "M2 1h3v1h1v1h4V2h1V1h3v4h1v5h-1v2h-3v3H6v-3H4v2H2v-1H1v-2H0V9h2v2h2v1h1v-1H3v-1H2V5z M4 6v3h1v1h6V9h1V6z",
  discord:
    "M4 2h3v1h2V2h3v1h1v2h1v3h1v5h-3v-1h-1v-1H5v1H4v1H1V8h1V5h1V3h1z M5 5v1H4v4h2V9h4v1h2V6h-1V5z M5 6h2v2H5z M9 6h2v2H9z",
  play: "M4 1h2v2h2v2h2v2h2v2h-2v2H8v2H6v2H4z",
  pause: "M3 2h4v12H3z M9 2h4v12H9z",
  close:
    "M2 2h2v2H2z M12 2h2v2h-2z M4 4h2v2H4z M10 4h2v2h-2z M6 6h4v4H6z M4 10h2v2H4z M10 10h2v2h-2z M2 12h2v2H2z M12 12h2v2h-2z",
  "check-circle": `${frame} M4 7h2v2h2V7h2V5h2v3h-2v2H8v2H6v-2H4z`,
  "cancel-circle": `${frame} M4 4h2v2H4z M10 4h2v2h-2z M6 6h4v4H6z M4 10h2v2H4z M10 10h2v2h-2z`,
  clock: `${frame} M7 4h2v4h3v2H7z`,
  sort: "M7 1h2v2h2v2H5V3h2z M5 11h6v2H9v2H7v-2H5z",
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
      data-pixel-icon={name}
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
