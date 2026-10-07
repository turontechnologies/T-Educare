import { apiClient } from "@/lib/axios";
import type { CourseGrade } from "@/types/course-grade";

export type CourseGradeFormPayload = {
  code: string;
  remark: string;
  gradeScore: number;
  minimumScore: number;
  maximumScore: number;
};

export const courseGradeService = {
  async list(includeArchived = false): Promise<CourseGrade[]> {
    const { data } = await apiClient.get<CourseGrade[]>("/course-grades", {
      params: { includeArchived },
    });
    return data;
  },

  async create(payload: CourseGradeFormPayload): Promise<CourseGrade> {
    const { data } = await apiClient.post<CourseGrade>(
      "/course-grades",
      payload,
    );
    return data;
  },

  async update(
    id: string,
    payload: Partial<CourseGradeFormPayload>,
  ): Promise<CourseGrade> {
    const { data } = await apiClient.patch<CourseGrade>(
      `/course-grades/${id}`,
      payload,
    );
    return data;
  },

  async archive(id: string): Promise<CourseGrade> {
    const { data } = await apiClient.post<CourseGrade>(
      `/course-grades/${id}/archive`,
    );
    return data;
  },

  async restore(id: string): Promise<CourseGrade> {
    const { data } = await apiClient.post<CourseGrade>(
      `/course-grades/${id}/restore`,
    );
    return data;
  },
};
