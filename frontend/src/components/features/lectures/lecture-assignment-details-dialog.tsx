"use client";

import {
  BookOpen,
  CalendarRange,
  Clock,
  MapPin,
  User,
  Users,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAssignmentRoster } from "@/hooks/use-lecture-assignments";
import { DAY_LABELS, formatTimeRange } from "@/lib/lecture-schedule";
import { fullName } from "@/lib/lecturers";
import { useAcademicsStore } from "@/store/academics.store";
import { useCoursesStore } from "@/store/courses.store";
import { useLecturersStore } from "@/store/lecturers.store";
import type { LectureAssignment } from "@/types/lecturer";

interface LectureAssignmentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment?: LectureAssignment;
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

/** Read-only view of a lecture assignment — who teaches it, which course (with unit count), which session, and its full weekly timetable. */
export function LectureAssignmentDetailsDialog({
  open,
  onOpenChange,
  assignment,
}: LectureAssignmentDetailsDialogProps) {
  const lecturers = useLecturersStore((state) => state.lecturers);
  const courses = useCoursesStore((state) => state.courses);
  const sessions = useAcademicsStore((state) => state.sessions);

  const lecturer = assignment
    ? lecturers.find((l) => l.id === assignment.lecturerId)
    : undefined;
  const course = assignment
    ? courses.find((c) => c.id === assignment.courseId)
    : undefined;
  const session = assignment
    ? sessions.find((s) => s.id === assignment.academicSessionId)
    : undefined;

  const { data: roster } = useAssignmentRoster(assignment?.id, {
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-xl gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Lecture Details
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

        {assignment && (
          <div className="space-y-5 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                icon={User}
                label="Lecturer"
                value={lecturer ? fullName(lecturer) : "—"}
              />
              <Field
                icon={CalendarRange}
                label="Academic Session"
                value={session?.session ?? "—"}
              />
            </div>

            <div className="rounded-md border border-border bg-muted/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                    <BookOpen className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Course</p>
                    <p className="text-sm font-medium text-foreground">
                      {course ? `${course.code} — ${course.name}` : "—"}
                    </p>
                  </div>
                </div>
                {course && (
                  <Badge className="bg-secondary/10 text-secondary">
                    {course.unit} unit{course.unit === 1 ? "" : "s"}
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                Weekly Timetable
              </p>
              {assignment.timetableSlots.length === 0 ? (
                <p className="rounded-md border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                  No timetable slots scheduled yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {assignment.timetableSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-foreground">
                        {DAY_LABELS[slot.dayOfWeek]}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3.5" />
                        {formatTimeRange(slot.startTime, slot.endTime)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3.5" />
                        {slot.venue}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  Students{" "}
                  {roster && roster.students.length > 0
                    ? `(${roster.students.length})`
                    : ""}
                </p>
                <span className="text-xs text-muted-foreground">
                  Current semester
                </span>
              </div>
              {!roster || roster.students.length === 0 ? (
                <p className="rounded-md border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                  <Users className="mx-auto mb-1.5 size-5 text-muted-foreground/60" />
                  No students registered for this course yet this semester.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
                  {roster.students.map((student) => (
                    <div
                      key={student.studentId}
                      className="flex flex-col items-center gap-1 rounded-md border border-border p-2 text-center"
                    >
                      <Avatar className="size-12">
                        <AvatarImage
                          src={student.avatarUrl ?? undefined}
                          alt={student.matricNo ?? "Student"}
                        />
                        <AvatarFallback>
                          <User className="size-5" />
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-mono text-[11px] font-medium text-foreground">
                        {student.matricNo ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
