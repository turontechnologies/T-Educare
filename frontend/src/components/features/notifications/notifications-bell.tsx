"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDetailsDialog } from "./notification-details-dialog";
import { timeAgo } from "@/lib/time";
import { useAuthStore } from "@/store/auth.store";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsFeed,
  useUnreadCount,
  type NotificationItem,
} from "@/hooks/use-notifications";

/**
 * The header's bell — entirely backend-real notifications (Institutions/
 * User Manager/Modules/License Manager, API_CONTRACT.md §10), already
 * scoped server-side to the caller (see `useNotificationsFeed`). Shared by
 * both `AppHeader` layouts (super admin and institution admin).
 */
export function NotificationsBell() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const { notifications: mine } = useNotificationsFeed();
  const { data: unreadCountData } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const [selected, setSelected] = useState<NotificationItem | null>(null);

  const unread = useMemo(() => mine.filter((n) => !n.read), [mine]);
  // The dropdown is an unread queue, not a history — the top 3 unread only.
  // Once something's read it drops out of here (the "empty" state below),
  // but it never disappears from the full notifications page, which still
  // shows everything regardless of read state.
  const recent = unread.slice(0, 3);

  const totalUnreadCount = unreadCountData?.count ?? 0;

  const viewAllHref =
    user?.role === "super_admin"
      ? "/super-admin/notifications"
      : "/dashboard/notifications";

  const handleSelect = (notification: NotificationItem) => {
    markRead.mutate(notification.id);
    setSelected(notification);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={
            totalUnreadCount > 0
              ? `Notifications, ${totalUnreadCount} unread`
              : "Notifications"
          }
          className="relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
        >
          <Bell className="size-5" />
          {totalUnreadCount > 0 && (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
              {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-1.5 py-1">
            <span className="text-sm font-semibold text-foreground">
              Notifications
            </span>
            {totalUnreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="cursor-pointer text-xs font-medium text-secondary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          <DropdownMenuSeparator />
          {recent.length === 0 ? (
            <p className="px-1.5 py-6 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            recent.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex-col items-start gap-0.5 whitespace-normal"
                onClick={() => handleSelect(notification)}
              >
                <span className="flex w-full items-center gap-1.5 font-medium text-foreground">
                  {/* Every item here is unread by construction (recent = unread.slice(0, 3)) */}
                  <span className="size-1.5 shrink-0 rounded-full bg-secondary" />
                  {notification.title}
                </span>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {notification.message}
                </span>
                <span className="text-[11px] text-muted-foreground/70">
                  {timeAgo(notification.createdAt)}
                </span>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => router.push(viewAllHref)}
            className="justify-center text-sm font-medium text-secondary"
          >
            View all notifications
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rendered outside the DropdownMenu on purpose — DropdownMenuContent
          unmounts on close, which would tear this down before it could show. */}
      <NotificationDetailsDialog
        notification={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
}
