export const PROGRAM_TYPES = ["Undergraduate", "Postgraduate"] as const;
export type ProgramType = (typeof PROGRAM_TYPES)[number];

export interface Program {
  id: string;
  name: string;
  /** FK to `Department.id`. */
  departmentId: string;
  /** FK to `Faculty.id` — stored independently, same convention as `Department.schoolId`. */
  facultyId: string;
  programType: ProgramType;
  createdAt: string;
  /** Nullable — soft-delete, same convention as every other admin table. */
  archivedAt: string | null;
}
