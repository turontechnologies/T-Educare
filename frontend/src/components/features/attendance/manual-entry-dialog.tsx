"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NotchedComboboxField,
  NotchedDateField,
  NotchedSelectField,
  NotchedTimeField,
} from "@/components/shared/notched-field";
import { useRecordManualAttendance } from "@/hooks/use-attendance";
import { fullName } from "@/lib/staff-members";
import { todayIsoDate } from "@/lib/attendance";
import { useStaffMembersStore } from "@/store/staff-members.store";
import type { AttendanceEventType } from "@/types/attendance";

interface ManualEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EVENT_TYPE_OPTIONS: { label: string; value: AttendanceEventType }[] = [
  { label: "Clock In", value: "CLOCK_IN" },
  { label: "Clock Out", value: "CLOCK_OUT" },
];

/** An admin recording a clock event by hand — the device was down, or a staff member forgot to tap. A note is required, same audit convention as a disciplinary action. */
export function ManualEntryDialog({
  open,
  onOpenChange,
}: ManualEntryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Record Manual Entry
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

        {open && <ManualEntryForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ManualEntryForm({ onDone }: { onDone: () => void }) {
  const staffMembers = useStaffMembersStore((state) => state.staffMembers);
  const recordManualEntry = useRecordManualAttendance();

  const [staffId, setStaffId] = useState("");
  const [eventType, setEventType] = useState<AttendanceEventType | "">("");
  const [date, setDate] = useState(todayIsoDate());
  const [time, setTime] = useState("08:00");
  const [note, setNote] = useState("");

  const staffOptions = staffMembers
    .filter((member) => !member.archivedAt)
    .map((member) => ({
      label: `${fullName(member)} (${member.staffId})`,
      value: member.staffId,
    }));

  const handleSubmit = async () => {
    if (!staffId || !eventType || !date || !time || !note.trim()) {
      toast.error("Fill in every field, including a note");
      return;
    }
    try {
      await recordManualEntry.mutateAsync({
        staffId,
        eventType,
        occurredAt: `${date}T${time}:00Z`,
        note: note.trim(),
      });
      toast.success("Attendance entry recorded");
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to record entry",
      );
    }
  };

  return (
    <div className="space-y-5 p-6">
      <NotchedComboboxField
        label="Staff Member"
        labelClassName="bg-popover"
        value={staffId}
        onValueChange={setStaffId}
        options={staffOptions}
        placeholder="Select staff member"
        searchPlaceholder="Search by name or staff ID…"
      />

      <NotchedSelectField
        label="Event Type"
        labelClassName="bg-popover"
        value={eventType}
        onValueChange={(value) => setEventType(value as AttendanceEventType)}
        options={EVENT_TYPE_OPTIONS}
        placeholder="Clock in or clock out"
      />

      <div className="grid grid-cols-2 gap-3">
        <NotchedDateField label="Date" value={date} onValueChange={setDate} />
        <NotchedTimeField label="Time" value={time} onValueChange={setTime} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Note (required)</Label>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Why is this being entered manually?"
          rows={3}
        />
      </div>

      <Button
        type="button"
        className="w-full gap-2 rounded-full"
        disabled={recordManualEntry.isPending}
        onClick={handleSubmit}
      >
        Record Entry
      </Button>
    </div>
  );
}
