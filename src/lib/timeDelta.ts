export function formatTimeDelta(totalSeconds: number): string {
  const secondsPerMinute = 60;
  const secondsPerHour = secondsPerMinute * 60;
  const secondsPerDay = secondsPerHour * 24;
  const secondsPerYear = secondsPerDay * 365;

  let remainingSeconds = totalSeconds;

  const years = Math.floor(remainingSeconds / secondsPerYear);
  remainingSeconds %= secondsPerYear;

  const days = Math.floor(remainingSeconds / secondsPerDay);
  remainingSeconds %= secondsPerDay;

  const hours = Math.floor(remainingSeconds / secondsPerHour);
  remainingSeconds %= secondsPerHour;

  const minutes = Math.floor(remainingSeconds / secondsPerMinute);
  remainingSeconds %= secondsPerMinute;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? "s" : ""}`);
  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
  if (remainingSeconds > 0)
    parts.push(`${remainingSeconds} second${remainingSeconds > 1 ? "s" : ""}`);

  return parts.join(", ");
}
