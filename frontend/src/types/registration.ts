export interface RegistrationSettings {
  requireCarryoverClearance: boolean;
  maxUnitsPerSemester: number;
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
