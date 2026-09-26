import { apiClient } from "@/lib/axios";
import type { PlatformModule } from "@/types/module";

export const moduleService = {
  async list(): Promise<{ data: PlatformModule[] }> {
    const { data } = await apiClient.get<{ data: PlatformModule[] }>(
      "/modules",
    );
    return data;
  },
};
