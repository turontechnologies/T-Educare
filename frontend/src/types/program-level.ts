export interface ProgramLevel {
  id: string;
  /** e.g. "100" */
  levelCode: string;
  /** e.g. "100 levels" */
  description: string;
  createdAt: string;
  /** Nullable — soft-delete, same convention as every other admin table. */
  archivedAt: string | null;
}
