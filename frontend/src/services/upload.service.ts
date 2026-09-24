import { apiClient } from "@/lib/axios";

export const uploadService = {
  async upload(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<{ url: string }>(
      "/uploads",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },
};
