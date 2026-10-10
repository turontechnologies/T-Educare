import type { PreStudentIdentifierPreference, Student } from "@/types/student";

/** The one place a student's display name is assembled — never string-concat firstName/lastName ad hoc elsewhere. */
export function fullName(
  student: Pick<Student, "firstName" | "middleName" | "lastName">,
) {
  return [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");
}

/** Badge for the cached `disciplinaryStatus` — the one place this is rendered, so the three non-NONE values stay visually distinct everywhere. */
export const DISCIPLINARY_STATUS_BADGE: Record<
  Exclude<Student["disciplinaryStatus"], "NONE">,
  { label: string; className: string }
> = {
  SUSPENDED: {
    label: "Suspended",
    className: "bg-amber-500/10 text-amber-600",
  },
  RUSTICATED: { label: "Rusticated", className: "bg-red-500/10 text-red-600" },
  EXPELLED: {
    label: "Expelled",
    className: "bg-destructive/10 text-destructive",
  },
};

/**
 * The institution's configured "primary" identifier for a pre-student (no
 * matric number yet) — the one place this preference is applied, so the
 * list table and the details dialog never disagree. Falls back to the
 * always-present `preAdmissionId` when the preferred value (a JAMB number)
 * hasn't actually been entered for this particular student.
 */
export function primaryPreStudentIdentifier(
  student: Pick<Student, "preAdmissionId" | "jambRegNumber">,
  preference: PreStudentIdentifierPreference,
) {
  if (preference === "JAMB_REG_NUMBER" && student.jambRegNumber) {
    return student.jambRegNumber;
  }
  return student.preAdmissionId;
}
