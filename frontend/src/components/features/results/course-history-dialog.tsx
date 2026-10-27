"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCourseResultHistory } from "@/hooks/use-course-results";

interface CourseHistoryDialogProps {
  courseId?: string;
  academicSemesterId?: string;
  onOpenChange: (open: boolean) => void;
}

const EVENT_LABEL: Record<string, string> = {
  SUBMITTED: "Submitted",
  PUBLISHED: "Published",
  UNPUBLISHED: "Unpublished",
};

export function CourseHistoryDialog({
  courseId,
  academicSemesterId,
  onOpenChange,
}: CourseHistoryDialogProps) {
  const open = !!courseId && !!academicSemesterId;
  const { data: events = [] } = useCourseResultHistory(
    courseId,
    academicSemesterId,
    { enabled: open },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-lg gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Course Result History
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <div className="max-h-[60vh] space-y-5 overflow-y-auto p-6">
          {events.map((event, index) => (
            <div
              key={index}
              className="border-b border-border pb-4 last:border-none last:pb-0"
            >
              <p className="font-semibold text-foreground">
                {EVENT_LABEL[event.eventType]}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(event.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                · {event.actorName}
              </p>
              {event.reason && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Reason: <span className="text-secondary">{event.reason}</span>
                </p>
              )}
            </div>
          ))}
          {events.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              No history yet.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-border bg-muted/50 px-6 py-4">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full px-6"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
