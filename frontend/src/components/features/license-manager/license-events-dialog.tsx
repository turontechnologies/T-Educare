"use client";

import { Clock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useLicenseEvents } from "@/hooks/use-institutions";
import { cn } from "@/lib/utils";
import type { Institution, LicenseEventType } from "@/types/institution";

const dateTimeLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

const EVENT_LABEL: Record<LicenseEventType, string> = {
  GRACE_STARTED: "Grace period started",
  SUSPENDED: "Suspended",
  RENEWED: "Renewed",
};

const EVENT_BADGE_CLASS: Record<LicenseEventType, string> = {
  GRACE_STARTED: "bg-amber-500/10 text-amber-600",
  SUSPENDED: "bg-destructive/10 text-destructive",
  RENEWED: "bg-emerald-500/10 text-emerald-600",
};

interface LicenseEventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution: Institution | null;
}

/** Read-only view of the append-only license-status audit log (API_CONTRACT.md §4.8) — history for support purposes only, never the source of current state. */
export function LicenseEventsDialog({
  open,
  onOpenChange,
  institution,
}: LicenseEventsDialogProps) {
  const { data: events, isLoading } = useLicenseEvents(institution?.id, {
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-lg gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            License History{institution ? ` — ${institution.name}` : ""}
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer text-white/80 transition-colors hover:text-white"
          >
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto p-6">
          {isLoading && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          )}

          {!isLoading && (events?.length ?? 0) === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No license-status changes recorded yet.
            </p>
          )}

          {events?.map((event) => (
            <div
              key={event.id}
              className="rounded-md border border-border bg-muted/40 p-4 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <Badge
                  className={cn("border-0", EVENT_BADGE_CLASS[event.eventType])}
                >
                  {EVENT_LABEL[event.eventType]}
                </Badge>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {dateTimeLabel(event.createdAt)}
                </span>
              </div>
              {event.reason && (
                <p className="mt-2 text-foreground">{event.reason}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                By{" "}
                {event.actorId === "SYSTEM"
                  ? "automated grace-period sweep"
                  : "a platform administrator"}
                {event.graceEndsAtSnapshot &&
                  ` · grace ended ${dateTimeLabel(event.graceEndsAtSnapshot)}`}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
