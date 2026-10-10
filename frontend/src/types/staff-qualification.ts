/**
 * One academic qualification on a staff member's record — degree, field
 * of study, and the institution attended (the "which school did they
 * attend" ask — distinct from this app's own School/Faculty hierarchy,
 * which is the institution's own org chart, not an external alma
 * mater). A real editable list (not append-only like Student's
 * disciplinary history) since a typo in a degree/year is a correction,
 * not a historical event.
 */
export interface StaffQualification {
  id: string;
  staffId: string;
  degree: string;
  fieldOfStudy: string;
  institutionAttended: string;
  yearObtained?: number;
  createdAt: string;
}
