import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppNotification, NotificationScope } from "@/types/notification";
import type { AuthenticatedUser } from "@/types/auth";

function makeId() {
  return `notif-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

interface NotificationsState {
  notifications: AppNotification[];
  addNotification: (input: {
    scope: NotificationScope;
    title: string;
    message: string;
    href?: string;
  }) => void;
  markAsRead: (id: string) => void;
  markManyAsRead: (ids: string[]) => void;
  dismiss: (id: string) => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      notifications: [],

      addNotification: (input) => {
        const notification: AppNotification = {
          id: makeId(),
          createdAt: new Date().toISOString(),
          read: false,
          ...input,
        };
        // Capped so a long-running demo session doesn't grow this forever.
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 200),
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        }));
      },

      markManyAsRead: (ids) => {
        const idSet = new Set(ids);
        set((state) => ({
          notifications: state.notifications.map((n) =>
            idSet.has(n.id) ? { ...n, read: true } : n,
          ),
        }));
      },

      dismiss: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },
    }),
    {
      name: "t-educare-notifications",
      version: 1,
      migrate: () => ({ notifications: [] }),
    },
  ),
);

/**
 * Which of the stored notifications a given logged-in user can actually
 * see — platform-wide ones for any super_admin, plus their own
 * institution's and their own personal ones for an institution_admin.
 * Shared by the header's bell dropdown and the full notifications page so
 * the two never drift apart on "what counts as mine".
 */
export function notificationsForUser(
  notifications: AppNotification[],
  user: AuthenticatedUser | null,
): AppNotification[] {
  if (!user) return [];
  return notifications.filter((n) => {
    if (n.scope.type === "platform") return user.role === "super_admin";
    if (n.scope.type === "institution") {
      return n.scope.institutionId === user.institutionId;
    }
    return n.scope.userId === user.id;
  });
}
