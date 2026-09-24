import { apiClient } from "@/lib/axios";

export const uploadService = {
  async upload(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    // apiClient's request interceptor (src/lib/axios.ts) strips the default
    // JSON Content-Type for any FormData body, so the browser can set its
    // own "multipart/form-data; boundary=..." — nothing to override here.
    const { data } = await apiClient.post<{ url: string }>(
      "/uploads",
      formData,
    );
    return data;
  },
};
