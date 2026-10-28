import type {
  CourseResultSubmissionStatus,
  DepartmentGroup,
} from "@/types/course-result";

/**
 * The raw `status` plus completion counts is everything either view needs
 * to derive its own display label — computed here rather than duplicated
 * as separate stored label fields on the backend (see
 * `CourseResultService`'s own doc comment on `CourseListItemResponse`).
 */
export function adminStatusLabel(status: CourseResultSubmissionStatus): string {
  switch (status) {
    case "PUBLISHED":
      return "Published";
    case "SUBMITTED":
      return "Awaiting Publishing";
    default:
      return "Pending Completion";
  }
}

export function teacherStatusLabel(
  status: CourseResultSubmissionStatus,
  scoredStudents: number,
  totalStudents: number,
): string {
  if (status === "PUBLISHED") return "Published";
  if (status === "SUBMITTED") return "Submitted";
  if (scoredStudents === 0) return "Not Started";
  if (scoredStudents >= totalStudents && totalStudents > 0)
    return "Awaiting Submission";
  return "In Progress";
}

const ADMIN_BADGE: Record<string, string> = {
  Published: "bg-emerald-500/10 text-emerald-600",
  "Awaiting Publishing": "bg-secondary/10 text-secondary",
  "Pending Completion": "bg-amber-500/10 text-amber-600",
};

const TEACHER_BADGE: Record<string, string> = {
  Published: "bg-emerald-500/10 text-emerald-600",
  Submitted: "bg-secondary/10 text-secondary",
  "Awaiting Submission": "bg-amber-500/10 text-amber-600",
  "In Progress": "bg-amber-500/10 text-amber-600",
  "Not Started": "bg-muted text-muted-foreground",
};

export function statusBadgeClass(
  label: string,
  variant: "admin" | "teacher",
): string {
  const map = variant === "admin" ? ADMIN_BADGE : TEACHER_BADGE;
  return map[label] ?? "bg-muted text-muted-foreground";
}

/** The Programs tab's (department, level) group status — already aggregated server-side to this three-value shape (not the raw course-level IN_PROGRESS/SUBMITTED/PUBLISHED enum), just needs a display label. */
export function departmentGroupStatusLabel(
  status: DepartmentGroup["status"],
): string {
  switch (status) {
    case "PUBLISHED":
      return "Published";
    case "AWAITING_PUBLISHING":
      return "Awaiting Publishing";
    default:
      return "Pending Completion";
  }
}
