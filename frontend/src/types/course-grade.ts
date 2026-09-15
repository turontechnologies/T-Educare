export interface CourseGrade {
  id: string;
  /** e.g. "A", "AB" */
  code: string;
  /** e.g. "Distinction", "Very Good" */
  remark: string;
  gradeScore: number;
  minimumScore: number;
  maximumScore: number;
  createdAt: string;
  /** Nullable — soft-delete, same convention as every other admin table. */
  archivedAt: string | null;
}
