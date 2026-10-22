"use client";

import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  useLectureAssignments,
  useTimetableChangeRequests,
} from "@/hooks/use-lecture-assignments";
import {
  DAY_LABELS,
  flattenSchedule,
  formatTimeRange,
  nextScheduleEntry,
} from "@/lib/lecture-schedule";
import { useCoursesStore } from "@/store/courses.store";
import { RequestTimeChangeDialog } from "./request-time-change-dialog";
import { StudentRosterPanel } from "./student-roster-panel";
import {
  WeeklyTimetableGrid,
  type TimetableBlock,
} from "./weekly-timetable-grid";
import type {
  TimetableChangeRequestStatus,
  TimetableSlot,
} from "@/types/lecturer";

const STATUS_BADGE: Record<TimetableChangeRequestStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600",
  APPROVED: "bg-emerald-500/10 text-emerald-600",
  REJECTED: "bg-destructive/10 text-destructive",
};

/** A logged-in lecturer's own self-service view — their next lecture, full weekly schedule, and the ability to request a different time. Shown instead of the admin table when `AuthenticatedUser.lecturerId` is present. */
export function MyLecturesView({ lecturerId }: { lecturerId: string }) {
  const { data: assignments } = useLectureAssignments({ lecturerId });
  const { data: changeRequests } = useTimetableChangeRequests(lecturerId);
  const courses = useCoursesStore((state) => state.courses);

  const [requestingSlot, setRequestingSlot] = useState<
    TimetableSlot | undefined
  >();

  const schedule = useMemo(
    () => flattenSchedule(assignments ?? []),
    [assignments],
  );
  const next = useMemo(() => nextScheduleEntry(schedule), [schedule]);

  const courseLabel = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? `${course.code} — ${course.name}` : courseId;
  };
  const courseUnit = (courseId: string) =>
    courses.find((c) => c.id === courseId)?.unit;

  const blocks: TimetableBlock[] = useMemo(
    () =>
      schedule.map(({ assignment, slot }) => {
        const unit = courseUnit(assignment.courseId);
        return {
          id: slot.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          title: courseLabel(assignment.courseId),
          subtitle: `${slot.venue}${unit !== undefined ? ` · ${unit} unit${unit === 1 ? "" : "s"}` : ""}`,
          onClick: () => setRequestingSlot(slot),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schedule, courses],
  );

  return (
    <div className="space-y-6">
      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both border-secondary/30 bg-secondary/5 duration-500">
        <CardContent className="flex items-start gap-4 p-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
            <CalendarClock className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Your Next Lecture
            </p>
            {next ? (
              <>
                <p className="mt-0.5 text-lg font-semibold text-foreground">
                  {courseLabel(next.assignment.courseId)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {DAY_LABELS[next.slot.dayOfWeek]} ·{" "}
                  {formatTimeRange(next.slot.startTime, next.slot.endTime)} ·{" "}
                  {next.slot.venue}
                  {courseUnit(next.assignment.courseId) !== undefined &&
                    ` · ${courseUnit(next.assignment.courseId)} unit${courseUnit(next.assignment.courseId) === 1 ? "" : "s"}`}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                You have no lectures scheduled yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardHeader>
          <p className="text-sm font-medium text-foreground">
            Your Weekly Timetable
          </p>
          <p className="text-xs text-muted-foreground">
            Click a lecture to request a different day, time, or venue.
          </p>
        </CardHeader>
        <CardContent>
          <WeeklyTimetableGrid blocks={blocks} />
        </CardContent>
      </Card>

      <StudentRosterPanel />

      {changeRequests && changeRequests.length > 0 && (
        <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
          <CardHeader>
            <p className="text-sm font-medium text-foreground">
              Your Change Requests
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {changeRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-md border border-border bg-muted/40 p-3 text-sm"
              >
                <p className="font-medium text-foreground">
                  Proposed: {DAY_LABELS[request.proposedDayOfWeek]},{" "}
                  {formatTimeRange(
                    request.proposedStartTime,
                    request.proposedEndTime,
                  )}
                  <Badge className={`ml-2 ${STATUS_BADGE[request.status]}`}>
                    {request.status}
                  </Badge>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {request.reason}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <RequestTimeChangeDialog
        open={!!requestingSlot}
        onOpenChange={(open) => !open && setRequestingSlot(undefined)}
        slot={requestingSlot}
        contextLabel={(() => {
          const entry = schedule.find((e) => e.slot.id === requestingSlot?.id);
          if (!entry) return undefined;
          const unit = courseUnit(entry.assignment.courseId);
          return `${courseLabel(entry.assignment.courseId)}${unit !== undefined ? ` · ${unit} unit${unit === 1 ? "" : "s"}` : ""}`;
        })()}
      />
    </div>
  );
}
