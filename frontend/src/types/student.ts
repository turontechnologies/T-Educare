export type StudentGender = "Male" | "Female" | "Other";
export type StudentStatus = "active" | "inactive";
export type DisciplinaryStatus =
  "NONE" | "SUSPENDED" | "RUSTICATED" | "EXPELLED";
/** UTME = standard JAMB-admission route; Direct Entry = already holds an OND/NCE/A-Level qualification, typically entering above 100L. Purely informational — doesn't auto-assign a level. */
export type AdmissionMode = "UTME" | "DIRECT_ENTRY";

export const STUDENT_TITLES = [
  "Mr",
  "Mrs",
  "Miss",
  "Dr",
  "Chief",
  "Engr",
  "Prof",
] as const;
export type StudentTitle = (typeof STUDENT_TITLES)[number];

export const MARITAL_STATUSES = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

export const RELIGIONS = [
  "Christian",
  "Islam",
  "Traditional",
  "Other",
] as const;
export type Religion = (typeof RELIGIONS)[number];

export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const GENOTYPES = ["AA", "AS", "SS", "AC"] as const;
export type Genotype = (typeof GENOTYPES)[number];

export const DISCIPLINARY_ACTION_TYPES = [
  "SUSPENSION",
  "RUSTICATION",
  "EXPULSION",
  "WARNING",
  "REINSTATEMENT",
] as const;
export type DisciplinaryActionType = (typeof DISCIPLINARY_ACTION_TYPES)[number];

export type CaseStatus = "open" | "resolved" | "dismissed";

/**
 * Comprehensive student profile (API_CONTRACT.md §7.13). `facultyId`/
 * `departmentId`/`programId`/`programLevelId` (current level) are real FKs
 * into the Academics hierarchy — matching the backend, which replaced the
 * original mock's free-text `faculty`/`department`/`programme` and fixed
 * `currentLevel` union with real ids. `matricNo` is nullable — a student
 * with none yet is a "pre-student" (just admitted, not yet matriculated);
 * assigning one via a normal edit is how they become a full student.
 * `preAdmissionId` is always present (auto-generated server-side at
 * creation, derived from the student's own id) — the fallback identifier
 * for a pre-student before a matric number exists; `jambRegNumber` is a
 * second, optional, real-world identifier an admin can record on top.
 */
export interface Student {
  id: string;
  matricNo: string | null;
  preAdmissionId: string;
  jambRegNumber?: string;
  admissionMode: AdmissionMode;
  title: StudentTitle;
  firstName: string;
  middleName?: string;
  lastName: string;
  otherName?: string;
  gender: StudentGender;
  maritalStatus: MaritalStatus;
  email: string;
  phone: string;
  emergencyContact: string;
  /** ISO date. */
  dateOfBirth: string;
  religion: Religion;
  maidenName?: string;
  bloodGroup: BloodGroup;
  genotype: Genotype;
  weightKg: number;
  heightCm: number;
  nationality: string;
  stateOfOrigin: string;
  lga: string;
  residentAddress: string;
  avatarUrl?: string;
  schoolId: string;
  facultyId: string;
  departmentId: string;
  programId: string;
  /** The student's CURRENT level — FK to ProgramLevel.id. */
  programLevelId: string;
  currentSessionId: string;
  status: StudentStatus;
  isGraduating: boolean;
  isDeferred: boolean;
  holdForReview: boolean;
  /** Cached current value — see `StudentDisciplinaryRecord` for the append-only history behind it. */
  disciplinaryStatus: DisciplinaryStatus;
  /** A plain summary on the record, not a full hostel-management system (that's its own separate module). */
  hostelName?: string;
  roomNumber?: string;
  allergies?: string;
  chronicConditions?: string;
  currentMedications?: string;
  pastSurgeries?: string;
  physicianName?: string;
  physicianPhone?: string;
  healthInsuranceProvider?: string;
  healthInsuranceNumber?: string;
  medicalNotes?: string;
  createdAt: string;
  archivedAt: string | null;
}

/**
 * One session's worth of a student's level/standing — append-only, never
 * edited or removed. `carryoverCourseIds` are real Course ids (the mock
 * used free-text course codes; Courses are a real resource now).
 * Per-course scores/grades are deliberately not modeled here — that's
 * Results Management, a separate, not-yet-built module.
 */
export interface StudentAcademicRecord {
  id: string;
  studentId: string;
  academicSessionId: string;
  programLevelId: string;
  status: "completed" | "current" | "repeat";
  carryoverCourseIds: string[];
  createdAt: string;
}

/** Append-only — mirrors `disciplinaryStatus`'s "cached value + immutable history" shape. */
export interface StudentDisciplinaryRecord {
  id: string;
  studentId: string;
  actionType: DisciplinaryActionType;
  reason: string;
  startDate: string | null;
  endDate: string | null;
  /** The recording staff/admin's id. */
  actorId: string | null;
  createdAt: string;
}

/** A reported case/incident — independent of (but may lead to) a disciplinary record; has a real editable lifecycle, unlike the append-only history above. */
export interface StudentCaseRecord {
  id: string;
  studentId: string;
  title: string;
  description: string;
  status: CaseStatus;
  reportedBy: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
}
