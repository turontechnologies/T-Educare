export interface School {
  id: string;
  /** e.g. "School of Engineering" — the academic unit sitting above faculties. */
  name: string;
  headName: string;
  /** e.g. "HOD", "Vice Chancellor" — free text, since a school head's title can be any administrative or academic rank. */
  designation: string;
  createdAt: string;
  /** Nullable — soft-delete, same convention as every other admin table. */
  archivedAt: string | null;
}
