"use client";

import { useMemo, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NotchedComboboxField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import { useAddHostelAllocation, useHostels } from "@/hooks/use-hostels";
import { useStudentsStore } from "@/store/students.store";
import type { HostelAllocation } from "@/types/hostel";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Students who already have an allocation record — excluded from the picker, since each student can only have one. */
  existingAllocations: HostelAllocation[];
}

export function AddStudentDialog({
  open,
  onOpenChange,
  existingAllocations,
}: AddStudentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Add Student
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {open && (
          <AddStudentForm
            existingAllocations={existingAllocations}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddStudentForm({
  existingAllocations,
  onDone,
}: {
  existingAllocations: HostelAllocation[];
  onDone: () => void;
}) {
  const students = useStudentsStore((state) => state.students);
  const { data: hostels = [] } = useHostels();
  const addStudent = useAddHostelAllocation();

  const [studentId, setStudentId] = useState("");
  const [hostelId, setHostelId] = useState("");
  const [roomId, setRoomId] = useState("");

  const allocatedStudentIds = useMemo(
    () => new Set(existingAllocations.map((a) => a.studentId)),
    [existingAllocations],
  );
  const eligibleStudents = useMemo(
    () =>
      students.filter((s) => !s.archivedAt && !allocatedStudentIds.has(s.id)),
    [students, allocatedStudentIds],
  );

  const selectedHostel = hostels.find((h) => h.id === hostelId);

  const handleSubmit = async () => {
    if (!studentId || !hostelId || !roomId) {
      toast.error("Select a student, hostel, and room");
      return;
    }
    try {
      await addStudent.mutateAsync({ studentId, hostelId, roomId });
      toast.success("Student added to allocations");
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add student",
      );
    }
  };

  return (
    <>
      <div className="space-y-5 p-6">
        <NotchedComboboxField
          label="Matric Number"
          labelClassName="bg-popover"
          value={studentId}
          onValueChange={setStudentId}
          options={eligibleStudents.map((s) => ({
            label: `${s.matricNo ?? s.preAdmissionId} — ${s.firstName} ${s.lastName}`,
            value: s.id,
          }))}
          placeholder="Select a student"
          searchPlaceholder="Search matric number or name…"
          emptyText="No eligible student found."
        />
        <NotchedSelectField
          label="Hostel"
          labelClassName="bg-popover"
          value={hostelId}
          onValueChange={(value) => {
            setHostelId(value);
            setRoomId("");
          }}
          options={hostels.map((h) => ({
            label: `${h.name} · ${
              h.totalBedspaces - h.occupiedCount > 0
                ? `${h.totalBedspaces - h.occupiedCount} free`
                : "Full"
            }`,
            value: h.id,
          }))}
          placeholder="Select"
        />
        <NotchedSelectField
          label="Room Number"
          labelClassName="bg-popover"
          value={roomId}
          onValueChange={setRoomId}
          options={(selectedHostel?.rooms ?? []).map((r) => ({
            label:
              r.capacity - r.occupiedCount > 0
                ? `${r.roomNumber} · ${r.capacity - r.occupiedCount} of ${r.capacity} bedspaces free`
                : `${r.roomNumber} · Full`,
            value: r.id,
          }))}
          placeholder="Select"
          disabled={!selectedHostel}
        />
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          disabled={addStudent.isPending}
          onClick={handleSubmit}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Save
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
