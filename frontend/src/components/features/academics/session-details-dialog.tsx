"use client";

import { CalendarRange, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAcademicsStore } from "@/store/academics.store";
import type { AcademicSession } from "@/types/academics";

const STATUS_BADGE_CLASS: Record<AcademicSession["status"], string> = {
  upcoming: "bg-secondary/10 text-secondary",
  active: "bg-emerald-500/10 text-emerald-600",
  completed: "bg-muted text-muted-foreground",
};

const dateOnlyLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
    .format(new Date(iso))
    .replace(/ /g, "-");

interface SessionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: AcademicSession;
}

/** Read-only "View Session" — the counterpart to the editable `SessionDialog`, for statuses where editing core dates no longer makes sense. */
export function SessionDetailsDialog({
  open,
  onOpenChange,
  session,
}: SessionDetailsDialogProps) {
  const semesters = useAcademicsStore((state) => state.semesters);
  const linkedSemesters = session
    ? semesters.filter((s) => s.sessionId === session.id && !s.archivedAt)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Session Details
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {session && (
          <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {session.session}
              </h3>
              <div className="flex items-center gap-1.5">
                {session.isCurrent && (
                  <Badge className="bg-tertiary/15 text-tertiary-foreground">
                    Current
                  </Badge>
                )}
                <Badge
                  className={cn(
                    "capitalize",
                    STATUS_BADGE_CLASS[session.status],
                  )}
                >
                  {session.status}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarRange className="size-4" />
              {dateOnlyLabel(session.from)} — {dateOnlyLabel(session.to)}
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Semesters ({linkedSemesters.length})
              </p>
              {linkedSemesters.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No semesters have been added to this session yet.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {linkedSemesters.map((semester) => (
                    <li
                      key={semester.id}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-foreground">
                        {semester.name}
                      </span>
                      <Badge
                        className={cn(
                          "capitalize",
                          STATUS_BADGE_CLASS[semester.status],
                        )}
                      >
                        {semester.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end border-t border-border bg-muted/50 px-6 py-4">
          <DialogClose className="cursor-pointer rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03] active:scale-[0.98]">
            Close
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
