/** One student's score in one course, for one semester — enriched so a table row never needs a separate lookup. {@code gradeCode}/{@code gradeRemark}/{@code gradePoint} are null when the score doesn't fall within any configured grade band. */
export interface CourseResult {
  id: string;
  studentId: string;
  studentMatricNo: string;
  studentName: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  courseUnit: number;
  academicSemesterId: string;
  score: number;
  gradeCode: string | null;
  gradeRemark: string | null;
  gradePoint: number | null;
  createdAt: string;
  updatedAt: string;
}

/** `gpa` is null (not zero) when there are no scored results yet, distinguishing "no results" from a real 0.00. */
export interface Gpa {
  academicSemesterId: string | null;
  gpa: number | null;
  totalUnits: number;
  courseCount: number;
}

export interface Cgpa {
  cgpa: number | null;
  totalUnits: number;
  courseCount: number;
  bySemester: Gpa[];
}
