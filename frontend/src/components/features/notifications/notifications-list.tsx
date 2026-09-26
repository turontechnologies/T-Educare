"use client";

import { useMemo, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationDetailsDialog } from "./notification-details-dialog";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import { useAuthStore } from "@/store/auth.store";
import {
  notificationsForUser,
  useNotificationsStore,
} from "@/store/notifications.store";
import {
  useDismissNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMergedNotifications,
  type MergedNotification,
} from "@/hooks/use-notifications";

type ReadFilter = "all" | "unread" | "read";

const READ_FILTER_OPTIONS: { label: string; value: ReadFilter }[] = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Read", value: "read" },
];

interface NotificationsListProps {
  breadcrumb: string[];
}

/** Full notifications feed — shared by `/super-admin/notifications` and `/dashboard/notifications`; the real/local merge happens once, in `useMergedNotifications`. */
export function NotificationsList({ breadcrumb }: NotificationsListProps) {
  const user = useAuthStore((state) => state.user);
  const localAll = useNotificationsStore((state) => state.notifications);
  const localMarkAsRead = useNotificationsStore((state) => state.markAsRead);
  const localMarkManyAsRead = useNotificationsStore(
    (state) => state.markManyAsRead,
  );
  const localDismiss = useNotificationsStore((state) => state.dismiss);

  const { notifications: mine } = useMergedNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const dismissReal = useDismissNotification();

  const [selected, setSelected] = useState<MergedNotification | null>(null);
  const [search, setSearch] = useState("");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");

  const unread = useMemo(() => mine.filter((n) => !n.read), [mine]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return mine.filter((notification) => {
      if (readFilter === "unread" && notification.read) return false;
      if (readFilter === "read" && !notification.read) return false;
      if (!query) return true;
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      );
    });
  }, [mine, search, readFilter]);

  const handleSelect = (notification: MergedNotification) => {
    if (notification.source === "real") {
      markRead.mutate(notification.id);
    } else {
      localMarkAsRead(notification.id);
    }
    setSelected(notification);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
    if (user?.role !== "super_admin") {
      localMarkManyAsRead(
        notificationsForUser(localAll, user)
          .filter((n) => !n.read)
          .map((n) => n.id),
      );
    }
  };

  const handleDismiss = (notification: MergedNotification) => {
    if (notification.source === "real") {
      dismissReal.mutate(notification.id);
    } else {
      localDismiss(notification.id);
    }
  };

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
            onClick={handleMarkAllRead}
          >
            Mark all as read ({unread.length})
          </Button>
        )}
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Filter</span>
            <Select
              value={readFilter}
              onValueChange={(value) => {
                if (value) setReadFilter(value as ReadFilter);
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {READ_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Label
              htmlFor="notifications-search"
              className="text-muted-foreground"
            >
              Search:
            </Label>
            <Input
              id="notifications-search"
              placeholder="Title or message…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-8 w-56"
            />
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <BellOff className="size-8" />
              <p className="text-sm">
                {mine.length === 0
                  ? "You're all caught up — no notifications yet."
                  : "No notifications match your search/filter."}
              </p>
            </div>
          ) : (
            filtered.map((notification) => (
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
                  onClick={() => handleSelect(notification)}
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
                  onClick={() => handleDismiss(notification)}
                  className="cursor-pointer rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <NotificationDetailsDialog
        notification={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}
