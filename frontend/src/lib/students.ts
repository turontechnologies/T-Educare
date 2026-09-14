import type { Student } from "@/types/student";

/** The one place a student's display name is assembled — never string-concat firstName/lastName ad hoc elsewhere. */
export function fullName(
  student: Pick<Student, "firstName" | "middleName" | "lastName">,
) {
  return [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");
}
