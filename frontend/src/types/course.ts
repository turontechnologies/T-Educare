export interface Course {
  id: string;
  name: string;
  /** e.g. "MAT101" — unique among non-archived courses. */
  code: string;
  /** FK to `Department.id`. */
  departmentId: string;
  /** FK to `School.id` — stored independently, same convention as `Department.schoolId`/`Program.facultyId`. */
  schoolId: string;
  /** FK to `ProgramLevel.id` — which level this course is taken at (e.g. 100L), used by the course-registration system to offer "this department's 100L courses". */
  programLevelId: string;
  /** Credit unit — drives the registration system's total-unit cap. */
  unit: number;
  /** FK to `StaffMember.id` — nullable, a course doesn't require a lecturer assigned. Drives "how many courses is this staff member lecturing" on the Staff Management detail view (filter the courses store by this id, no separate endpoint). */
  lecturerId?: string;
  createdAt: string;
  /** Nullable — soft-delete, same convention as every other admin table. */
  archivedAt: string | null;
}
