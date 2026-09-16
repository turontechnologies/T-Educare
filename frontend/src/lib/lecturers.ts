import type { Lecturer } from "@/types/lecturer";

/** The one place a lecturer's display name is assembled — never string-concat firstName/lastName ad hoc elsewhere. */
export function fullName(
  lecturer: Pick<Lecturer, "firstName" | "middleName" | "lastName">,
) {
  return [lecturer.firstName, lecturer.middleName, lecturer.lastName]
    .filter(Boolean)
    .join(" ");
}
