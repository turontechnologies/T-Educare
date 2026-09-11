import { useNotificationsStore } from "@/store/notifications.store";

/**
 * Thin, terse wrappers around `useNotificationsStore`'s `addNotification` —
 * call one of these right next to the existing `toast.success(...)` at
 * every meaningful action (create/archive/activate/reset/etc.) so the
 * in-app notification feed and the toast fire from the same place and
 * never drift apart. See `frontend/CLAUDE.md` for the full convention.
 */

export function notifyPlatform(title: string, message: string, href?: string) {
  useNotificationsStore
    .getState()
    .addNotification({ scope: { type: "platform" }, title, message, href });
}

export function notifyInstitution(
  institutionId: string,
  title: string,
  message: string,
  href?: string,
) {
  useNotificationsStore.getState().addNotification({
    scope: { type: "institution", institutionId },
    title,
    message,
    href,
  });
}

export function notifyUser(
  userId: string,
  title: string,
  message: string,
  href?: string,
) {
  useNotificationsStore
    .getState()
    .addNotification({ scope: { type: "user", userId }, title, message, href });
}
