/**
 * Detects a numeric-suffix progression from the most recently created
 * record's identifier (e.g. "XYZ-ST-1001" -> "XYZ-ST-1002") and proposes
 * the next one in that sequence, preserving whatever prefix and
 * zero-padding width the admin's own first entry established. Returns
 * undefined when there's nothing to base a progression on yet (no
 * existing codes, or the most recent one has no trailing digits to
 * increment) — the admin sets the very first one manually, by design;
 * this never invents a starting format on its own.
 */
export function nextSequentialId<T>(
  records: T[],
  getCreatedAt: (record: T) => string,
  getCode: (record: T) => string | null | undefined,
): string | undefined {
  const withCodes = records
    .filter((record) => !!getCode(record))
    .sort((a, b) => getCreatedAt(a).localeCompare(getCreatedAt(b)));
  const last = withCodes[withCodes.length - 1];
  if (!last) return undefined;

  const code = getCode(last);
  const match = code?.match(/^(.*?)(\d+)$/);
  if (!match) return undefined;

  const [, prefix, digits] = match;
  const taken = new Set(
    records
      .map((record) => getCode(record))
      .filter((value): value is string => !!value),
  );

  let n = Number(digits) + 1;
  let candidate = prefix + String(n).padStart(digits.length, "0");
  while (taken.has(candidate)) {
    n++;
    candidate = prefix + String(n).padStart(digits.length, "0");
  }
  return candidate;
}
