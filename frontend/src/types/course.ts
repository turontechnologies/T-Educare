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
  /** Credit unit — drives the registration system's total-unit cap. This is the course's own (home department's) unit; a borrowing department can override it — see `CourseDepartmentOffering`. */
  unit: number;
  /** 1 or 2 — which semester-of-the-year this course is taken in. The same department/level can have a completely different course list for its 1st vs. 2nd semester; matched against `AcademicSemester.semesterNumber` at registration time. */
  semesterNumber: 1 | 2;
  /** FK to `StaffMember.id` — nullable, a course doesn't require a lecturer assigned. Drives "how many courses is this staff member lecturing" on the Staff Management detail view (filter the courses store by this id, no separate endpoint). */
  lecturerId?: string;
  createdAt: string;
  /** Nullable — soft-delete, same convention as every other admin table. */
  archivedAt: string | null;
}

/**
 * A "borrowed course" grant: `Course.departmentId` is the course's
 * home/owning department, but another department can also require its
 * own students to take it — this is that explicit grant.
 * `unitOverride` lets the same course carry a different credit load for
 * the borrowing department (null = use the course's own base `unit`).
 * `compulsory` marks it as a real requirement (not an elective) for the
 * borrowing department — real "must not fail it" enforcement depends on
 * a future Results Management module (per-course grades aren't modeled
 * yet); this flag is the registration-time half of that intent.
 */
export interface CourseDepartmentOffering {
  id: string;
  courseId: string;
  /** FK to `Department.id` — the borrowing department. */
  departmentId: string;
  unitOverride?: number;
  compulsory: boolean;
  createdAt: string;
}
