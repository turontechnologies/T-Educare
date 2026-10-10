import { apiClient } from "@/lib/axios";
import type { AcademicSemester } from "@/types/academics";

export type AcademicSemesterFormPayload = {
  sessionId: string;
  name: string;
  semesterNumber: 1 | 2;
  description?: string;
  from: string;
  to: string;
  status?: string;
};

export const academicSemesterService = {
  async list(includeArchived = false): Promise<AcademicSemester[]> {
    const { data } = await apiClient.get<AcademicSemester[]>(
      "/academic-semesters",
      {
        params: { includeArchived },
      },
    );
    return data;
  },

  async create(
    payload: AcademicSemesterFormPayload,
  ): Promise<AcademicSemester> {
    const { data } = await apiClient.post<AcademicSemester>(
      "/academic-semesters",
      payload,
    );
    return data;
  },

  async update(
    id: string,
    payload: Partial<AcademicSemesterFormPayload>,
  ): Promise<AcademicSemester> {
    const { data } = await apiClient.patch<AcademicSemester>(
      `/academic-semesters/${id}`,
      payload,
    );
    return data;
  },

  async archive(id: string): Promise<AcademicSemester> {
    const { data } = await apiClient.post<AcademicSemester>(
      `/academic-semesters/${id}/archive`,
    );
    return data;
  },

  async restore(id: string): Promise<AcademicSemester> {
    const { data } = await apiClient.post<AcademicSemester>(
      `/academic-semesters/${id}/restore`,
    );
    return data;
  },

  async setCurrent(id: string): Promise<AcademicSemester> {
    const { data } = await apiClient.post<AcademicSemester>(
      `/academic-semesters/${id}/set-current`,
    );
    return data;
  },

  async close(id: string): Promise<AcademicSemester> {
    const { data } = await apiClient.post<AcademicSemester>(
      `/academic-semesters/${id}/close`,
    );
    return data;
  },
};
