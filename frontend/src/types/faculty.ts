export interface Faculty {
  id: string;
  name: string;
  deanName: string;
  /** FK to `School.id` — a faculty sits within one school. */
  schoolId: string;
  createdAt: string;
  /** Nullable — soft-delete, same convention as every other admin table. */
  archivedAt: string | null;
}
