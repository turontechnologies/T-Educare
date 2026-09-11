"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { timeAgo } from "@/lib/time";
import { useAuthStore } from "@/store/auth.store";
import {
  notificationsForUser,
  useNotificationsStore,
} from "@/store/notifications.store";

/**
 * The header's bell — real, automatically-populated notifications (see
 * `src/lib/notify.ts`), not a static placeholder dot. Shared by both
 * `AppHeader` layouts (super admin and institution admin) since the
 * filtering by role/institution/account already happens in
 * `notificationsForUser`.
 */
export function NotificationsBell() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const allNotifications = useNotificationsStore(
    (state) => state.notifications,
  );
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const markManyAsRead = useNotificationsStore((state) => state.markManyAsRead);

  const mine = useMemo(
    () => notificationsForUser(allNotifications, user),
    [allNotifications, user],
  );
  const unread = useMemo(() => mine.filter((n) => !n.read), [mine]);
  const recent = mine.slice(0, 8);
  const viewAllHref =
    user?.role === "super_admin"
      ? "/super-admin/notifications"
      : "/dashboard/notifications";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={
          unread.length > 0
            ? `Notifications, ${unread.length} unread`
            : "Notifications"
        }
        className="relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
      >
        <Bell className="size-5" />
        {unread.length > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-1.5 py-1">
          <span className="text-sm font-semibold text-foreground">
            Notifications
          </span>
          {unread.length > 0 && (
            <button
              type="button"
              onClick={() => markManyAsRead(unread.map((n) => n.id))}
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
              onClick={() => {
                markAsRead(notification.id);
                if (notification.href) router.push(notification.href);
              }}
            >
              <span className="flex w-full items-center gap-1.5 font-medium text-foreground">
                {!notification.read && (
                  <span className="size-1.5 shrink-0 rounded-full bg-secondary" />
                )}
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
  );
}
