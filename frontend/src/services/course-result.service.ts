import { apiClient } from "@/lib/axios";
import type { Cgpa, CourseResult, Gpa } from "@/types/course-result";
import type { Course } from "@/types/course";

export type CreateCourseResultPayload = {
  studentId: string;
  courseId: string;
  academicSemesterId: string;
  score: number;
};

export const courseResultService = {
  async listForCourse(
    courseId: string,
    academicSemesterId: string,
  ): Promise<CourseResult[]> {
    const { data } = await apiClient.get<CourseResult[]>("/course-results", {
      params: { courseId, academicSemesterId },
    });
    return data;
  },

  async listForStudent(
    studentId: string,
    academicSemesterId: string,
  ): Promise<CourseResult[]> {
    const { data } = await apiClient.get<CourseResult[]>("/course-results", {
      params: { studentId, academicSemesterId },
    });
    return data;
  },

  /** Scoped to the caller: a lecturer sees their own courses, plus their whole department's if they're its linked HOD. Empty for a pure admin — use the regular Courses list instead. */
  async myCourses(): Promise<Course[]> {
    const { data } = await apiClient.get<Course[]>(
      "/course-results/my/courses",
    );
    return data;
  },

  async create(payload: CreateCourseResultPayload): Promise<CourseResult> {
    const { data } = await apiClient.post<CourseResult>(
      "/course-results",
      payload,
    );
    return data;
  },

  async update(id: string, score: number): Promise<CourseResult> {
    const { data } = await apiClient.patch<CourseResult>(
      `/course-results/${id}`,
      { score },
    );
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/course-results/${id}`);
  },

  async gpa(studentId: string, academicSemesterId: string): Promise<Gpa> {
    const { data } = await apiClient.get<Gpa>("/course-results/gpa", {
      params: { studentId, academicSemesterId },
    });
    return data;
  },

  async cgpa(studentId: string): Promise<Cgpa> {
    const { data } = await apiClient.get<Cgpa>("/course-results/cgpa", {
      params: { studentId },
    });
    return data;
  },
};
