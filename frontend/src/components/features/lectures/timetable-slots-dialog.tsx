"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import {
  useAddTimetableSlot,
  useRemoveTimetableSlot,
} from "@/hooks/use-lecture-assignments";
import { DAY_LABELS, formatTimeRange } from "@/lib/lecture-schedule";
import { fullName } from "@/lib/lecturers";
import { useCoursesStore } from "@/store/courses.store";
import { useLecturersStore } from "@/store/lecturers.store";
import {
  DAYS_OF_WEEK,
  type DayOfWeek,
  type LectureAssignment,
} from "@/types/lecturer";

interface TimetableSlotsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment?: LectureAssignment;
}

const DAY_OPTIONS = DAYS_OF_WEEK.map((day) => ({
  label: DAY_LABELS[day],
  value: day,
}));

/** Manage an assignment's weekly timetable slots — day/time/venue. */
export function TimetableSlotsDialog({
  open,
  onOpenChange,
  assignment,
}: TimetableSlotsDialogProps) {
  const lecturers = useLecturersStore((state) => state.lecturers);
  const courses = useCoursesStore((state) => state.courses);

  const lecturerName = assignment
    ? fullName(
        lecturers.find((l) => l.id === assignment.lecturerId) ?? {
          firstName: "—",
          lastName: "",
        },
      )
    : "";
  const course = assignment
    ? courses.find((c) => c.id === assignment.courseId)
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-lg gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Timetable — {lecturerName}
            {course ? ` · ${course.code}` : ""}
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

        {open && assignment && (
          <SlotsContent key={assignment.id} assignment={assignment} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SlotsContent({ assignment }: { assignment: LectureAssignment }) {
  const addSlot = useAddTimetableSlot();
  const removeSlot = useRemoveTimetableSlot();

  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek | "">("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venue, setVenue] = useState("");

  const handleAdd = async () => {
    if (!dayOfWeek || !startTime || !endTime || !venue.trim()) {
      toast.error("Fill in day, start/end time, and venue");
      return;
    }
    try {
      await addSlot.mutateAsync({
        assignmentId: assignment.id,
        payload: { dayOfWeek, startTime, endTime, venue: venue.trim() },
      });
      toast.success("Timetable slot added");
      setDayOfWeek("");
      setStartTime("");
      setEndTime("");
      setVenue("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add slot",
      );
    }
  };

  const handleRemove = async (slotId: string) => {
    try {
      await removeSlot.mutateAsync({ assignmentId: assignment.id, slotId });
      toast.success("Timetable slot removed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove slot",
      );
    }
  };

  return (
    <div className="space-y-5 p-6">
      <div className="grid grid-cols-2 gap-3">
        <NotchedSelectField
          label="Day"
          labelClassName="bg-popover"
          value={dayOfWeek}
          onValueChange={(value) => setDayOfWeek(value as DayOfWeek)}
          options={DAY_OPTIONS}
          placeholder="Select day"
        />
        <NotchedField
          label="Venue"
          labelClassName="bg-popover"
          placeholder="e.g. Room 4"
          value={venue}
          onChange={(event) => setVenue(event.target.value)}
        />
        <NotchedField
          label="Start Time"
          labelClassName="bg-popover"
          type="time"
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
        />
        <NotchedField
          label="End Time"
          labelClassName="bg-popover"
          type="time"
          value={endTime}
          onChange={(event) => setEndTime(event.target.value)}
        />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-1.5"
        disabled={addSlot.isPending}
        onClick={handleAdd}
      >
        <Plus className="size-3.5" />
        Add Slot
      </Button>

      <div className="space-y-2">
        {assignment.timetableSlots.length > 0 ? (
          assignment.timetableSlots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-foreground">
                  {DAY_LABELS[slot.dayOfWeek]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeRange(slot.startTime, slot.endTime)} · {slot.venue}
                </p>
              </div>
              <button
                type="button"
                aria-label="Remove slot"
                onClick={() => handleRemove(slot.id)}
                className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        ) : (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No timetable slots scheduled yet.
          </p>
        )}
      </div>
    </div>
  );
}
