import { apiClient } from "@/lib/axios";
import type {
  Announcement,
  AnnouncementTargetOption,
  AnnouncementTargetScope,
} from "@/types/announcement";

export type AttachmentPayload = {
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
};

export type AnnouncementFormPayload = {
  headline: string;
  body: string;
  sendViaApp: boolean;
  sendViaEmail: boolean;
  targetScope: AnnouncementTargetScope;
  targetValue?: string;
  attachments: AttachmentPayload[];
  action: "SEND" | "SCHEDULE" | "DRAFT";
  scheduledFor?: string;
};

export const announcementService = {
  async list(status?: string): Promise<Announcement[]> {
    const { data } = await apiClient.get<Announcement[]>("/announcements", {
      params: status ? { status } : undefined,
    });
    return data;
  },

  async targetOptions(
    scope: AnnouncementTargetScope,
  ): Promise<AnnouncementTargetOption[]> {
    const { data } = await apiClient.get<AnnouncementTargetOption[]>(
      "/announcements/targets",
      { params: { scope } },
    );
    return data;
  },

  async create(payload: AnnouncementFormPayload): Promise<Announcement> {
    const { data } = await apiClient.post<Announcement>(
      "/announcements",
      payload,
    );
    return data;
  },

  async update(
    id: string,
    payload: AnnouncementFormPayload,
  ): Promise<Announcement> {
    const { data } = await apiClient.patch<Announcement>(
      `/announcements/${id}`,
      payload,
    );
    return data;
  },

  async sendNow(id: string): Promise<Announcement> {
    const { data } = await apiClient.post<Announcement>(
      `/announcements/${id}/send`,
    );
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/announcements/${id}`);
  },
};
