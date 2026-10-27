"use client";

import { useMemo } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnnouncementCard } from "./announcement-card";
import {
  useDeleteAnnouncement,
  useSendAnnouncementNow,
} from "@/hooks/use-announcements";
import type { Announcement } from "@/types/announcement";

function monthKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

interface AnnouncementFeedProps {
  announcements: Announcement[];
  /** Which timestamp drives the month grouping — sentAt for Sent, scheduledFor for Scheduled, updatedAt for Draft. */
  groupBy: (announcement: Announcement) => string;
  emptyText: string;
  onEdit?: (announcement: Announcement) => void;
}

export function AnnouncementFeed({
  announcements,
  groupBy,
  emptyText,
  onEdit,
}: AnnouncementFeedProps) {
  const sendNow = useSendAnnouncementNow();
  const deleteAnnouncement = useDeleteAnnouncement();

  const groups = useMemo(() => {
    const byMonth = new Map<string, Announcement[]>();
    for (const announcement of announcements) {
      const key = monthKey(groupBy(announcement));
      const list = byMonth.get(key) ?? [];
      list.push(announcement);
      byMonth.set(key, list);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([key, items]) => ({
        key,
        label: monthLabel(groupBy(items[0])),
        items,
      }));
  }, [announcements, groupBy]);

  const handleSendNow = async (announcement: Announcement) => {
    try {
      await sendNow.mutateAsync(announcement.id);
      toast.success(`${announcement.headline} sent`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send");
    }
  };

  const handleDelete = async (announcement: Announcement) => {
    try {
      await deleteAnnouncement.mutateAsync(announcement.id);
      toast.success("Announcement deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  if (announcements.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.key} className="space-y-3">
          <div className="flex items-baseline gap-2">
            <h3 className="font-semibold text-foreground">{group.label}</h3>
            <span className="text-xs text-muted-foreground">
              {group.items.length} announcement
              {group.items.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-3">
            {group.items.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                actions={
                  onEdit ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Actions for ${announcement.headline}`}
                        className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onEdit(announcement)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleSendNow(announcement)}
                        >
                          Send now
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(announcement)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : undefined
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
