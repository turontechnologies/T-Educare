"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { timeAgo } from "@/lib/time";
import type { NotificationItem } from "@/hooks/use-notifications";

interface NotificationDetailsDialogProps {
  /** Null closes the dialog — same controlled-by-selection pattern as the other feature dialogs in this app. */
  notification: NotificationItem | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Shown when a notification is clicked, instead of navigating away
 * immediately — gives the full, untruncated title/message first, with an
 * explicit "Take me there" action for wherever it happened (`href`), so
 * clicking a notification is never a surprise jump away from the current
 * page.
 */
export function NotificationDetailsDialog({
  notification,
  onOpenChange,
}: NotificationDetailsDialogProps) {
  const router = useRouter();

  return (
    <Dialog open={!!notification} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Notification
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {notification && (
          <div className="space-y-3 p-6">
            <p className="text-base font-semibold text-foreground">
              {notification.title}
            </p>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground/70">
              {timeAgo(notification.createdAt)}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
          <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Close
          </DialogClose>
          {notification?.href && (
            <Button
              type="button"
              onClick={() => {
                const href = notification.href;
                onOpenChange(false);
                if (href) router.push(href);
              }}
              className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Take me there
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
