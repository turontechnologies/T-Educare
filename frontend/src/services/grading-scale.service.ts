import { apiClient } from "@/lib/axios";

export interface GradingScale {
  maxGradePoint: number;
}

export const gradingScaleService = {
  async get(): Promise<GradingScale> {
    const { data } = await apiClient.get<GradingScale>("/grading-scale");
    return data;
  },

  async update(maxGradePoint: number): Promise<GradingScale> {
    const { data } = await apiClient.put<GradingScale>("/grading-scale", {
      maxGradePoint,
    });
    return data;
  },
};
