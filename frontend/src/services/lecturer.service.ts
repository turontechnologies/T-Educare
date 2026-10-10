import { apiClient } from "@/lib/axios";
import type {
  Lecturer,
  LecturerAssignmentType,
  LecturerGender,
  LecturerPosition,
} from "@/types/lecturer";

export type LecturerFormPayload = {
  username: string;
  position: LecturerPosition;
  assignmentType: LecturerAssignmentType;
  assignmentId: string;
  gender: LecturerGender;
  firstName: string;
  middleName?: string;
  lastName: string;
  otherName?: string;
  email: string;
  phone: string;
};

export type LecturerImportResult = { imported: number; skipped: number };

export const lecturerService = {
  async list(
    params: { search?: string; includeArchived?: boolean } = {},
  ): Promise<Lecturer[]> {
    const { data } = await apiClient.get<Lecturer[]>("/lecturers", { params });
    return data;
  },

  async create(payload: LecturerFormPayload): Promise<Lecturer> {
    const { data } = await apiClient.post<Lecturer>("/lecturers", payload);
    return data;
  },

  async update(
    id: string,
    payload: Partial<LecturerFormPayload>,
  ): Promise<Lecturer> {
    const { data } = await apiClient.patch<Lecturer>(
      `/lecturers/${id}`,
      payload,
    );
    return data;
  },

  async archive(id: string): Promise<Lecturer> {
    const { data } = await apiClient.post<Lecturer>(`/lecturers/${id}/archive`);
    return data;
  },

  async restore(id: string): Promise<Lecturer> {
    const { data } = await apiClient.post<Lecturer>(`/lecturers/${id}/restore`);
    return data;
  },

  async importCsv(file: File): Promise<LecturerImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<LecturerImportResult>(
      "/lecturers/import",
      formData,
    );
    return data;
  },

  async exportCsv(includeArchived = false): Promise<Blob> {
    const { data } = await apiClient.get("/lecturers/export", {
      params: { includeArchived },
      responseType: "blob",
    });
    return data;
  },
};
