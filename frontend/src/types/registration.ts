export interface RegistrationSettings {
  requireCarryoverClearance: boolean;
  maxUnitsPerSemester: number;
  /** Null means no window set — registration stays unrestricted, same as before this existed. */
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  /** A separate, admin-settable extension past `registrationClosesAt` — reopening is just setting this (or the window itself) again, to whatever date they want, as many times as needed. */
  registrationGracePeriodEndsAt: string | null;
}

export interface CourseRegistration {
  id: string;
  studentId: string;
  courseId: string;
  academicSemesterId: string;
  unitSnapshot: number;
  isCarryover: boolean;
  createdAt: string;
}
