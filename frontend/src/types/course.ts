export interface Course {
  id: string;
  name: string;
  /** e.g. "MAT101" — unique among non-archived courses. */
  code: string;
  /** FK to `Department.id`. */
  departmentId: string;
  /** FK to `School.id` — stored independently, same convention as `Department.schoolId`/`Program.facultyId`. */
  schoolId: string;
  createdAt: string;
  /** Nullable — soft-delete, same convention as every other admin table. */
  archivedAt: string | null;
}
