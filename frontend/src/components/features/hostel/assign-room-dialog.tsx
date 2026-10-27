"use client";

import { useState } from "react";
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
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import {
  useConfirmAllocation,
  useHostels,
  useProposeAllocation,
} from "@/hooks/use-hostels";
import type { HostelAllocation } from "@/types/hostel";

interface AssignRoomDialogProps {
  allocation?: HostelAllocation;
  /** "confirm" -> ALLOCATED ("Allocate"/"Change room"); "propose" -> PENDING_ALLOCATION ("Move to allocations"). */
  mode: "confirm" | "propose";
  title: string;
  onOpenChange: (open: boolean) => void;
}

/** Shared by "Allocate" (Pending -> Allocated), "Change room" (Allocated -> Allocated, new room), and "Move to allocations" (Waitlist -> Pending) — same hostel/room picker, different resulting status. */
export function AssignRoomDialog({
  allocation,
  mode,
  title,
  onOpenChange,
}: AssignRoomDialogProps) {
  return (
    <Dialog open={!!allocation} onOpenChange={onOpenChange}>
      {allocation && (
        <AssignRoomDialogContent
          key={allocation.id}
          allocation={allocation}
          mode={mode}
          title={title}
          onOpenChange={onOpenChange}
        />
      )}
    </Dialog>
  );
}

function AssignRoomDialogContent({
  allocation,
  mode,
  title,
  onOpenChange,
}: {
  allocation: HostelAllocation;
  mode: "confirm" | "propose";
  title: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: hostels = [] } = useHostels();
  const confirmAllocation = useConfirmAllocation();
  const proposeAllocation = useProposeAllocation();

  const [hostelId, setHostelId] = useState(allocation.hostelId ?? "");
  const [roomId, setRoomId] = useState(allocation.roomId ?? "");

  const selectedHostel = hostels.find((h) => h.id === hostelId);
  const mutation = mode === "confirm" ? confirmAllocation : proposeAllocation;

  const handleSubmit = async () => {
    if (!hostelId || !roomId) {
      toast.error("Select a hostel and room");
      return;
    }
    try {
      await mutation.mutateAsync({
        id: allocation.id,
        payload: { hostelId, roomId },
      });
      toast.success(
        mode === "confirm" ? "Room confirmed" : "Moved to allocations",
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save room assignment",
      );
    }
  };

  return (
    <DialogContent
      showCloseButton={false}
      className="w-full max-w-md gap-0 overflow-hidden p-0"
    >
      <div className="flex items-center justify-between bg-primary px-6 py-4">
        <DialogTitle className="text-base font-medium text-white">
          {title}
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

      <div className="space-y-5 p-6">
        <NotchedField
          label="Matric Number"
          labelClassName="bg-popover"
          value={`${allocation.studentName} · ${allocation.departmentName}`}
          readOnly
          disabled
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
          disabled={mutation.isPending}
          onClick={handleSubmit}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Save
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </DialogContent>
  );
}
