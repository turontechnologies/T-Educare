import { apiClient } from "@/lib/axios";

export const uploadService = {
  async upload(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    // Must NOT set "multipart/form-data" explicitly — that has no boundary
    // parameter, which breaks the server's multipart parsing. Overriding
    // apiClient's default "application/json" with `undefined` lets the
    // browser generate the correct header (including the boundary) itself
    // when it serializes the FormData body.
    const { data } = await apiClient.post<{ url: string }>(
      "/uploads",
      formData,
      { headers: { "Content-Type": undefined } },
    );
    return data;
  },
};
