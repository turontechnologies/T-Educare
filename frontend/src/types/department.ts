export interface Department {
  id: string;
  name: string;
  hodName: string;
  /** FK to `Faculty.id`. */
  facultyId: string;
  /**
   * FK to `School.id` — stored independently rather than derived through
   * `facultyId`. The reference data this was built against pairs a
   * department's faculty and school independently (e.g. "Law Department"
   * under "Faculty of Law" shows a *different* school than Faculty of
   * Law's own `schoolId`), so this resource doesn't enforce the nested
   * school → faculty → department containment strictly.
   */
  schoolId: string;
  createdAt: string;
  /** Nullable — soft-delete, same convention as every other admin table. */
  archivedAt: string | null;
}
