import { apiClient } from "@/lib/axios";
import type {
  Cgpa,
  ComponentScores,
  CourseResultEvent,
  CourseResultListItem,
  CourseReview,
  DepartmentGroup,
  DepartmentGroupDetail,
  GracePeriod,
  Gpa,
  MarkingGuide,
  MyCourseProgress,
} from "@/types/course-result";

export type MarkingGuideComponentPayload = {
  name: string;
  weight: number;
};

export type MarkingGuidePayload = {
  name: string;
  components: MarkingGuideComponentPayload[];
};

export type GracePeriodPayload = {
  deadlineDate: string;
  gracePeriodDays: number;
};

export type StudentScorePayload = {
  studentId: string;
  score: number;
};

export const courseResultService = {
  async getMarkingGuide(): Promise<MarkingGuide> {
    const { data } = await apiClient.get<MarkingGuide>(
      "/course-results/marking-guide",
    );
    return data;
  },

  async updateMarkingGuide(
    payload: MarkingGuidePayload,
  ): Promise<MarkingGuide> {
    const { data } = await apiClient.put<MarkingGuide>(
      "/course-results/marking-guide",
      payload,
    );
    return data;
  },

  async getGracePeriod(): Promise<GracePeriod> {
    const { data } = await apiClient.get<GracePeriod>(
      "/course-results/grace-period",
    );
    return data;
  },

  async updateGracePeriod(payload: GracePeriodPayload): Promise<GracePeriod> {
    const { data } = await apiClient.put<GracePeriod>(
      "/course-results/grace-period",
      payload,
    );
    return data;
  },

  async listCourses(
    academicSemesterId: string,
  ): Promise<CourseResultListItem[]> {
    const { data } = await apiClient.get<CourseResultListItem[]>(
      "/course-results/courses",
      {
        params: { academicSemesterId },
      },
    );
    return data;
  },

  async review(
    courseId: string,
    academicSemesterId: string,
  ): Promise<CourseReview> {
    const { data } = await apiClient.get<CourseReview>(
      `/course-results/courses/${courseId}/review`,
      { params: { academicSemesterId } },
    );
    return data;
  },

  async publish(courseId: string, academicSemesterId: string): Promise<void> {
    await apiClient.post(`/course-results/courses/${courseId}/publish`, null, {
      params: { academicSemesterId },
    });
  },

  async unpublish(
    courseId: string,
    academicSemesterId: string,
    reason: string,
  ): Promise<void> {
    await apiClient.post(
      `/course-results/courses/${courseId}/unpublish`,
      { reason },
      { params: { academicSemesterId } },
    );
  },

  async history(
    courseId: string,
    academicSemesterId: string,
  ): Promise<CourseResultEvent[]> {
    const { data } = await apiClient.get<CourseResultEvent[]>(
      `/course-results/courses/${courseId}/history`,
      { params: { academicSemesterId } },
    );
    return data;
  },

  async myCourseProgress(
    courseId: string,
    academicSemesterId: string,
  ): Promise<MyCourseProgress> {
    const { data } = await apiClient.get<MyCourseProgress>(
      `/course-results/my/courses/${courseId}`,
      { params: { academicSemesterId } },
    );
    return data;
  },

  async componentScores(
    courseId: string,
    componentId: string,
    academicSemesterId: string,
  ): Promise<ComponentScores> {
    const { data } = await apiClient.get<ComponentScores>(
      `/course-results/my/courses/${courseId}/components/${componentId}/scores`,
      { params: { academicSemesterId } },
    );
    return data;
  },

  async saveComponentScores(
    courseId: string,
    componentId: string,
    academicSemesterId: string,
    scores: StudentScorePayload[],
  ): Promise<void> {
    await apiClient.put(
      `/course-results/my/courses/${courseId}/components/${componentId}/scores`,
      { scores },
      { params: { academicSemesterId } },
    );
  },

  async submit(courseId: string, academicSemesterId: string): Promise<void> {
    await apiClient.post(
      `/course-results/my/courses/${courseId}/submit`,
      null,
      {
        params: { academicSemesterId },
      },
    );
  },

  async listDepartmentGroups(
    academicSemesterId: string,
  ): Promise<DepartmentGroup[]> {
    const { data } = await apiClient.get<DepartmentGroup[]>(
      "/course-results/departments",
      {
        params: { academicSemesterId },
      },
    );
    return data;
  },

  async departmentGroupDetail(
    departmentId: string,
    programLevelId: string,
    academicSemesterId: string,
  ): Promise<DepartmentGroupDetail> {
    const { data } = await apiClient.get<DepartmentGroupDetail>(
      "/course-results/departments/detail",
      { params: { departmentId, programLevelId, academicSemesterId } },
    );
    return data;
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
