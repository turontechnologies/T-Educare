"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRequestTimetableChange } from "@/hooks/use-lecture-assignments";
import { DAY_LABELS } from "@/lib/lecture-schedule";
import {
  DAYS_OF_WEEK,
  type DayOfWeek,
  type TimetableSlot,
} from "@/types/lecturer";

interface RequestTimeChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot?: TimetableSlot;
}

const DAY_OPTIONS = DAYS_OF_WEEK.map((day) => ({
  label: DAY_LABELS[day],
  value: day,
}));

/** A lecturer's own request to move one of their timetable slots — reviewed by an admin from ChangeRequestsPanel. */
export function RequestTimeChangeDialog({
  open,
  onOpenChange,
  slot,
}: RequestTimeChangeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Request a Different Time
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

        {open && slot && (
          <RequestForm
            key={slot.id}
            slot={slot}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RequestForm({
  slot,
  onDone,
}: {
  slot: TimetableSlot;
  onDone: () => void;
}) {
  const requestChange = useRequestTimetableChange();

  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(slot.dayOfWeek);
  const [startTime, setStartTime] = useState(slot.startTime);
  const [endTime, setEndTime] = useState(slot.endTime);
  const [venue, setVenue] = useState(slot.venue);
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!startTime || !endTime || !reason.trim()) {
      toast.error("Fill in the proposed time and a reason");
      return;
    }
    try {
      await requestChange.mutateAsync({
        timetableSlotId: slot.id,
        proposedDayOfWeek: dayOfWeek,
        proposedStartTime: startTime,
        proposedEndTime: endTime,
        proposedVenue: venue.trim() || undefined,
        reason: reason.trim(),
      });
      toast.success("Request sent to the admin for review");
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send request",
      );
    }
  };

  return (
    <div className="space-y-5 p-6">
      <p className="text-xs text-muted-foreground">
        Currently {DAY_LABELS[slot.dayOfWeek]}, {slot.startTime}–{slot.endTime}{" "}
        at {slot.venue}. Propose a replacement below.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <NotchedSelectField
          label="Proposed Day"
          labelClassName="bg-popover"
          value={dayOfWeek}
          onValueChange={(value) => setDayOfWeek(value as DayOfWeek)}
          options={DAY_OPTIONS}
          placeholder="Select day"
        />
        <NotchedField
          label="Proposed Venue"
          labelClassName="bg-popover"
          value={venue}
          onChange={(event) => setVenue(event.target.value)}
        />
        <NotchedField
          label="Proposed Start"
          labelClassName="bg-popover"
          type="time"
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
        />
        <NotchedField
          label="Proposed End"
          labelClassName="bg-popover"
          type="time"
          value={endTime}
          onChange={(event) => setEndTime(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Reason</Label>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Why do you need a different time?"
          rows={3}
        />
      </div>

      <Button
        type="button"
        className="w-full gap-2 rounded-full"
        disabled={requestChange.isPending}
        onClick={handleSubmit}
      >
        Send Request
      </Button>
    </div>
  );
}
