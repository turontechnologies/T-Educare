import { apiClient } from "@/lib/axios";
import type {
  CourseRegistration,
  RegistrationSettings,
} from "@/types/registration";

export type UpdateRegistrationSettingsPayload = {
  requireCarryoverClearance: boolean;
  maxUnitsPerSemester: number;
  /** ISO-8601 instant strings — omit or send "" to clear. */
  registrationOpensAt?: string;
  registrationClosesAt?: string;
  registrationGracePeriodEndsAt?: string;
};

export type ReplaceCourseRegistrationsPayload = {
  studentId: string;
  academicSemesterId: string;
  courseIds: string[];
};

export const registrationSettingsService = {
  async get(): Promise<RegistrationSettings> {
    const { data } = await apiClient.get<RegistrationSettings>(
      "/registration-settings",
    );
    return data;
  },

  async update(
    payload: UpdateRegistrationSettingsPayload,
  ): Promise<RegistrationSettings> {
    const { data } = await apiClient.put<RegistrationSettings>(
      "/registration-settings",
      payload,
    );
    return data;
  },
};

export const courseRegistrationService = {
  async list(
    studentId: string,
    academicSemesterId: string,
  ): Promise<CourseRegistration[]> {
    const { data } = await apiClient.get<CourseRegistration[]>(
      "/course-registrations",
      {
        params: { studentId, academicSemesterId },
      },
    );
    return data;
  },

  async listByCourse(
    courseId: string,
    academicSemesterId: string,
  ): Promise<CourseRegistration[]> {
    const { data } = await apiClient.get<CourseRegistration[]>(
      "/course-registrations",
      {
        params: { courseId, academicSemesterId },
      },
    );
    return data;
  },

  /** Full replace, not additive — same convention as `linkModules`/`GradingScale`'s own PUT. */
  async replace(
    payload: ReplaceCourseRegistrationsPayload,
  ): Promise<CourseRegistration[]> {
    const { data } = await apiClient.put<CourseRegistration[]>(
      "/course-registrations",
      payload,
    );
    return data;
  },
};
