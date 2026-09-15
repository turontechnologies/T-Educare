import type { StaffMember } from "@/types/staff-member";

/** The one place a staff member's display name is assembled — never string-concat firstName/lastName ad hoc elsewhere. */
export function fullName(
  staff: Pick<StaffMember, "firstName" | "middleName" | "lastName">,
) {
  return [staff.firstName, staff.middleName, staff.lastName]
    .filter(Boolean)
    .join(" ");
}
