"use client";

import { Check, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  useApproveTimetableChange,
  useRejectTimetableChange,
  useTimetableChangeRequests,
} from "@/hooks/use-lecture-assignments";
import { DAY_LABELS, formatTimeRange } from "@/lib/lecture-schedule";
import { fullName } from "@/lib/lecturers";
import { useLecturersStore } from "@/store/lecturers.store";
import type { TimetableChangeRequestStatus } from "@/types/lecturer";

const STATUS_BADGE: Record<TimetableChangeRequestStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600",
  APPROVED: "bg-emerald-500/10 text-emerald-600",
  REJECTED: "bg-destructive/10 text-destructive",
};

/** Admin-side review queue for lecturer-submitted "request a different time" change requests. */
export function ChangeRequestsPanel() {
  const { data: requests } = useTimetableChangeRequests();
  const lecturers = useLecturersStore((state) => state.lecturers);
  const approve = useApproveTimetableChange();
  const reject = useRejectTimetableChange();

  const lecturerName = (id: string) =>
    fullName(
      lecturers.find((l) => l.id === id) ?? { firstName: "—", lastName: "" },
    );

  const pending = (requests ?? []).filter((r) => r.status === "PENDING");
  const resolved = (requests ?? []).filter((r) => r.status !== "PENDING");

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
      <CardHeader>
        <p className="text-sm font-medium text-foreground">
          Timetable Change Requests
        </p>
        <p className="text-xs text-muted-foreground">
          Lecturers requesting a different day, time, or venue for one of their
          scheduled lectures.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {pending.length === 0 && resolved.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No timetable change requests yet.
          </p>
        )}
        {[...pending, ...resolved].map((request) => (
          <div
            key={request.id}
            className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/40 p-3 text-sm"
          >
            <div>
              <p className="font-medium text-foreground">
                {lecturerName(request.requestedByLecturerId)}
                <Badge className={`ml-2 ${STATUS_BADGE[request.status]}`}>
                  {request.status}
                </Badge>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Proposed: {DAY_LABELS[request.proposedDayOfWeek]},{" "}
                {formatTimeRange(
                  request.proposedStartTime,
                  request.proposedEndTime,
                )}
                {request.proposedVenue ? ` · ${request.proposedVenue}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Reason: {request.reason}
              </p>
            </div>
            {request.status === "PENDING" && (
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Approve"
                  onClick={async () => {
                    try {
                      await approve.mutateAsync(request.id);
                      toast.success("Change request approved");
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Failed to approve request",
                      );
                    }
                  }}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10"
                >
                  <Check className="size-3.5" />
                  Approve
                </button>
                <button
                  type="button"
                  aria-label="Reject"
                  onClick={async () => {
                    try {
                      await reject.mutateAsync(request.id);
                      toast.success("Change request rejected");
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Failed to reject request",
                      );
                    }
                  }}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <XIcon className="size-3.5" />
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
