const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

/** "Just now" / "5 minutes ago" / "3 hours ago" / "2 days ago" — shared by the notifications bell and the full notifications list. */
export function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return relativeTimeFormatter.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return relativeTimeFormatter.format(-hours, "hour");
  return relativeTimeFormatter.format(-Math.round(hours / 24), "day");
}
