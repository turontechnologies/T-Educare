import { apiClient } from "@/lib/axios";

/** The real, server-generated shape (API_CONTRACT.md §10) — deliberately has no `scope`, since the backend already scoped it to the caller before returning it. */
export interface RealNotification {
  id: string;
  title: string;
  message: string;
  href?: string;
  createdAt: string;
  read: boolean;
}

export type NotificationsListParams = {
  page?: number;
  perPage?: number;
};

export type NotificationsListResponse = {
  data: RealNotification[];
  meta: { page: number; perPage: number; total: number };
};

export const notificationService = {
  async list(
    params: NotificationsListParams = {},
  ): Promise<NotificationsListResponse> {
    const { data } = await apiClient.get<NotificationsListResponse>(
      "/notifications",
      { params },
    );
    return data;
  },

  async unreadCount(): Promise<{ count: number }> {
    const { data } = await apiClient.get<{ count: number }>(
      "/notifications/unread-count",
    );
    return data;
  },

  async markRead(id: string): Promise<RealNotification> {
    const { data } = await apiClient.patch<RealNotification>(
      `/notifications/${id}/read`,
    );
    return data;
  },

  async markAllRead(): Promise<void> {
    await apiClient.post("/notifications/read-all");
  },

  /** A real delete, not an archive — personal housekeeping, not a destructive admin action (API_CONTRACT.md §10.2). */
  async dismiss(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },
};
