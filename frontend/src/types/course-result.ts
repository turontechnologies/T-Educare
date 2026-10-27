export interface MarkingGuideComponent {
  id: string;
  name: string;
  weight: number;
}

export interface MarkingGuide {
  name: string;
  components: MarkingGuideComponent[];
  totalWeight: number;
}

export interface GracePeriod {
  deadlineDate: string | null;
  gracePeriodDays: number;
}

export type CourseResultSubmissionStatus =
  "IN_PROGRESS" | "SUBMITTED" | "PUBLISHED";

/** One row of the admin "Courses" tab or a lecturer's "My Courses" tab. */
export interface CourseResultListItem {
  courseId: string;
  courseCode: string;
  courseName: string;
  departmentName: string;
  schoolName: string;
  lecturerName: string;
  totalStudents: number;
  scoredStudents: number;
  status: CourseResultSubmissionStatus;
  academicSemesterId: string;
}

export interface ComponentScoreCell {
  componentId: string;
  componentName: string;
  weight: number;
  score: number | null;
}

export interface CourseResultRow {
  studentId: string;
  studentMatricNo: string;
  studentName: string;
  components: ComponentScoreCell[];
  overall: number | null;
  gradeCode: string | null;
  gradeRemark: string | null;
  gradePoint: number | null;
}

export interface CourseReview {
  courseId: string;
  courseCode: string;
  courseName: string;
  departmentName: string;
  schoolName: string;
  levelCode: string;
  status: CourseResultSubmissionStatus;
  totalStudents: number;
  scoredStudents: number;
  academicSemesterId: string;
  components: MarkingGuideComponent[];
  students: CourseResultRow[];
}

export type ComponentProgressStatus =
  "NOT_STARTED" | "IN_PROGRESS" | "RECORDED";

export interface ComponentProgress {
  componentId: string;
  componentName: string;
  weight: number;
  scoredStudents: number;
  totalStudents: number;
  status: ComponentProgressStatus;
}

export interface MyCourseProgress {
  courseId: string;
  courseCode: string;
  courseName: string;
  departmentName: string;
  schoolName: string;
  levelCode: string;
  status: CourseResultSubmissionStatus;
  deadlineLabel: string | null;
  totalStudents: number;
  academicSemesterId: string;
  components: ComponentProgress[];
  canSubmit: boolean;
}

export interface StudentScoreCell {
  studentId: string;
  matricNo: string;
  studentName: string;
  score: number | null;
}

export interface ComponentScores {
  componentId: string;
  componentName: string;
  weight: number;
  students: StudentScoreCell[];
}

export interface CourseResultEvent {
  eventType: "SUBMITTED" | "PUBLISHED" | "UNPUBLISHED";
  actorName: string;
  reason: string | null;
  createdAt: string;
}

/** One row of the admin "Programs" tab — one (department, program level) group. */
export interface DepartmentGroup {
  departmentId: string;
  departmentName: string;
  schoolName: string;
  programLevelId: string;
  levelCode: string;
  totalCourses: number;
  submittedCourses: number;
  status: "PENDING_COMPLETION" | "AWAITING_PUBLISHING" | "PUBLISHED";
  academicSemesterId: string;
}

export interface DepartmentCourseColumn {
  courseId: string;
  courseCode: string;
}

export interface PerCourseCell {
  courseId: string;
  score: number | null;
  gradeCode: string | null;
}

export interface DepartmentStudentRow {
  studentId: string;
  studentMatricNo: string;
  studentName: string;
  perCourse: PerCourseCell[];
  overallPercent: number | null;
  overallGradeCode: string | null;
  gpa: number | null;
  cgpa: number | null;
}

export interface DepartmentGroupDetail {
  departmentName: string;
  schoolName: string;
  levelCode: string;
  totalCourses: number;
  submittedCourses: number;
  status: "PENDING_COMPLETION" | "AWAITING_PUBLISHING" | "PUBLISHED";
  academicSemesterId: string;
  courses: DepartmentCourseColumn[];
  students: DepartmentStudentRow[];
}

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
