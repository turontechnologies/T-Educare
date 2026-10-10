import { apiClient } from "@/lib/axios";
import type { Course, CourseDepartmentOffering } from "@/types/course";

export type CourseFormPayload = {
  name: string;
  code: string;
  departmentId: string;
  schoolId: string;
  programLevelId: string;
  unit: number;
  semesterNumber: 1 | 2;
  /** Omit/blank to leave unassigned; an explicit "" on update clears an existing lecturer. */
  lecturerId?: string;
};

export type AddCourseDepartmentOfferingPayload = {
  departmentId: string;
  unitOverride?: number;
  compulsory: boolean;
};

export interface CourseImportResult {
  imported: number;
  skipped: number;
}

export const courseService = {
  async list(
    includeArchived = false,
    departmentId?: string,
    schoolId?: string,
    search?: string,
  ): Promise<Course[]> {
    const { data } = await apiClient.get<Course[]>("/courses", {
      params: { includeArchived, departmentId, schoolId, search },
    });
    return data;
  },

  async create(payload: CourseFormPayload): Promise<Course> {
    const { data } = await apiClient.post<Course>("/courses", payload);
    return data;
  },

  async update(
    id: string,
    payload: Partial<CourseFormPayload>,
  ): Promise<Course> {
    const { data } = await apiClient.patch<Course>(`/courses/${id}`, payload);
    return data;
  },

  async archive(id: string): Promise<Course> {
    const { data } = await apiClient.post<Course>(`/courses/${id}/archive`);
    return data;
  },

  async restore(id: string): Promise<Course> {
    const { data } = await apiClient.post<Course>(`/courses/${id}/restore`);
    return data;
  },

  async import(file: File): Promise<CourseImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    // apiClient's request interceptor (src/lib/axios.ts) strips the default
    // JSON Content-Type for any FormData body — same as upload.service.ts.
    const { data } = await apiClient.post<CourseImportResult>(
      "/courses/import",
      formData,
    );
    return data;
  },

  async export(includeArchived = false): Promise<Blob> {
    const { data } = await apiClient.get("/courses/export", {
      params: { includeArchived },
      responseType: "blob",
    });
    return data;
  },

  async listOfferings(courseId: string): Promise<CourseDepartmentOffering[]> {
    const { data } = await apiClient.get<CourseDepartmentOffering[]>(
      `/courses/${courseId}/offerings`,
    );
    return data;
  },

  async addOffering(
    courseId: string,
    payload: AddCourseDepartmentOfferingPayload,
  ): Promise<CourseDepartmentOffering> {
    const { data } = await apiClient.post<CourseDepartmentOffering>(
      `/courses/${courseId}/offerings`,
      payload,
    );
    return data;
  },

  async removeOffering(courseId: string, offeringId: string): Promise<void> {
    await apiClient.delete(`/courses/${courseId}/offerings/${offeringId}`);
  },
};
