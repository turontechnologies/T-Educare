/**
 * Who a notification is visible to:
 *  - "platform"    → every super_admin.
 *  - "institution" → any admin account (root or restricted-role staff)
 *    logged into that specific institution.
 *  - "user"        → only the one account it names (e.g. "your password
 *    was reset").
 */
export type NotificationScope =
  | { type: "platform" }
  | { type: "institution"; institutionId: string }
  | { type: "user"; userId: string };

export interface AppNotification {
  id: string;
  scope: NotificationScope;
  title: string;
  message: string;
  /** Where clicking the notification navigates, if anywhere. */
  href?: string;
  createdAt: string;
  read: boolean;
}
