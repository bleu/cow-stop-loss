export function timeOptionsToSeconds(
  timeOption: "15 minutes" | "1 hour" | "1 day"
): number {
  switch (timeOption) {
    case "15 minutes":
      return 15 * 60;
    case "1 hour":
      return 60 * 60;
    case "1 day":
      return 24 * 60 * 60;
  }
}
