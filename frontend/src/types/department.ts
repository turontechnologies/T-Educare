export interface Department {
  id: string;
  name: string;
  hodName: string;
  /** Nullable — set once an admin uploads it (via the generic uploads endpoint), shown on this department's own Course Registration Slips. */
  hodSignatureUrl: string | null;
  /** Nullable — FK to `Lecturer.id`, the real account behind `hodName`. Drives self-service scoping: that lecturer sees every course in this department for Results, not just their own. Independent of `hodName`, which can still be free text if the HOD isn't in the system as a Lecturer. */
  hodLecturerId: string | null;
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
