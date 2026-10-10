import type { StaffMember } from "@/types/staff-member";

/** The one place a staff member's display name is assembled — never string-concat firstName/lastName ad hoc elsewhere. */
export function fullName(
  staff: Pick<StaffMember, "firstName" | "middleName" | "lastName">,
) {
  return [staff.firstName, staff.middleName, staff.lastName]
    .filter(Boolean)
    .join(" ");
}

/**
 * Badge for the cached `disciplinaryStatus` — mirrors students.ts's
 * DISCIPLINARY_STATUS_BADGE. `Partial` (rather than keying only on the
 * non-"NONE" variants) is deliberate: it makes every lookup type as
 * possibly-`undefined`, so a stale/unexpected value (e.g. a pre-migration
 * cached record with no `disciplinaryStatus` at all) is a type error to
 * use without a guard, not a runtime crash.
 */
export const STAFF_DISCIPLINARY_STATUS_BADGE: Partial<
  Record<
    StaffMember["disciplinaryStatus"],
    { label: string; className: string }
  >
> = {
  SUSPENDED: {
    label: "Suspended",
    className: "bg-amber-500/10 text-amber-600",
  },
  TERMINATED: {
    label: "Terminated",
    className: "bg-destructive/10 text-destructive",
  },
};

/** Badge for each disciplinary action-type on the history list (distinct from the cached status badge above). */
export const STAFF_DISCIPLINARY_ACTION_BADGE_CLASS: Record<string, string> = {
  WARNING: "bg-orange-500/15 text-orange-600",
  QUERY: "bg-amber-500/10 text-amber-600",
  SUSPENSION: "bg-amber-500/10 text-amber-600",
  TERMINATION: "bg-destructive/10 text-destructive",
  REINSTATEMENT: "bg-emerald-500/10 text-emerald-600",
};
