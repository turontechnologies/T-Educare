/**
 * Small, deliberately-impure helpers (Math.random/Date.now) kept at module
 * scope and called only from event handlers or store actions — never during
 * render — per the react-hooks/purity rule (see frontend/CLAUDE.md).
 */

export function generateUsername(firstName: string, lastName: string) {
  const base = `${firstName}${lastName.charAt(0)}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${base || "user"}${suffix}`;
}

const PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";

export function generatePassword(length = 10) {
  return Array.from(
    { length },
    () => PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)],
  ).join("");
}
