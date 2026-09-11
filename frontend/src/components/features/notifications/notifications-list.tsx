"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import { useAuthStore } from "@/store/auth.store";
import {
  notificationsForUser,
  useNotificationsStore,
} from "@/store/notifications.store";

interface NotificationsListProps {
  breadcrumb: string[];
}

/** Full notifications feed — shared by `/super-admin/notifications` and `/dashboard/notifications`; scoping to "what's mine" happens once, in `notificationsForUser`. */
export function NotificationsList({ breadcrumb }: NotificationsListProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const allNotifications = useNotificationsStore(
    (state) => state.notifications,
  );
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const markManyAsRead = useNotificationsStore((state) => state.markManyAsRead);
  const dismiss = useNotificationsStore((state) => state.dismiss);

  const mine = useMemo(
    () => notificationsForUser(allNotifications, user),
    [allNotifications, user],
  );
  const unread = useMemo(() => mine.filter((n) => !n.read), [mine]);

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={breadcrumb} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-primary">
          <Bell className="size-5" />
          Notifications
        </h1>
        {unread.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => markManyAsRead(unread.map((n) => n.id))}
          >
            Mark all as read ({unread.length})
          </Button>
        )}
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardContent className="divide-y divide-border p-0">
          {mine.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <BellOff className="size-8" />
              <p className="text-sm">
                You&apos;re all caught up — no notifications yet.
              </p>
            </div>
          ) : (
            mine.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "group flex items-start gap-3 px-4 py-3.5 transition-colors animate-in fade-in duration-300",
                  !notification.read && "bg-secondary/5",
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    notification.read ? "bg-transparent" : "bg-secondary",
                  )}
                />
                <button
                  type="button"
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.href) router.push(notification.href);
                  }}
                  className="min-w-0 flex-1 cursor-pointer text-left"
                >
                  <p className="text-sm font-medium text-foreground">
                    {notification.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {timeAgo(notification.createdAt)}
                  </p>
                </button>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => dismiss(notification.id)}
                  className="cursor-pointer rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
