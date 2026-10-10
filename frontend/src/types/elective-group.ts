/**
 * A "choose N of these courses" requirement, scoped to one department and
 * program level (e.g. "Elective Group 1" at 300L: pick one of CSC301 or
 * CSC305). `minSelect`/`maxSelect` are both inclusive — a plain "pick
 * exactly one" group sets both to 1. Enforced by the registration system
 * when a student submits their course selections, not before.
 */
export interface ElectiveGroup {
  id: string;
  departmentId: string;
  programLevelId: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  courseIds: string[];
  createdAt: string;
  /** Nullable — soft-delete, same convention as every other admin table. */
  archivedAt: string | null;
}
