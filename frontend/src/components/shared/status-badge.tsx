import { Badge } from "@/components/ui/badge";

interface StatusBadgeConfig {
  label: string;
  className: string;
}

interface StatusBadgeProps<T extends string> {
  status: T | undefined;
  map: Partial<Record<T, StatusBadgeConfig>>;
  fallback?: StatusBadgeConfig;
}

/**
 * Looks up `status` in `map` and renders a `Badge`, falling back to
 * `fallback` (or rendering nothing) for a missing/unrecognized value —
 * the one place this guard lives, so a stale or unexpected status value
 * (e.g. cached data from before a field existed) can never crash a page
 * instead of just rendering a sensible default.
 */
export function StatusBadge<T extends string>({
  status,
  map,
  fallback,
}: StatusBadgeProps<T>) {
  const resolved = (status ? map[status] : undefined) ?? fallback;
  if (!resolved) return null;
  return <Badge className={resolved.className}>{resolved.label}</Badge>;
}
