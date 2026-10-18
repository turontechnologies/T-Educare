"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NotchedDateField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import {
  useCreateMyLeaveRequest,
  useMyLeaveBalance,
  useMyLeaveTypes,
} from "@/hooks/use-leave";
import { todayIsoDate } from "@/lib/attendance";

interface RequestLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestLeaveDialog({
  open,
  onOpenChange,
}: RequestLeaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Request Leave
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

        {open && <RequestLeaveForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function RequestLeaveForm({ onDone }: { onDone: () => void }) {
  const { data: types = [] } = useMyLeaveTypes();
  const { data: balances = [] } = useMyLeaveBalance();
  const createRequest = useCreateMyLeaveRequest();

  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [endDate, setEndDate] = useState(todayIsoDate());
  const [reason, setReason] = useState("");

  const selectedBalance = balances.find((b) => b.leaveTypeId === leaveTypeId);

  const handleSubmit = async () => {
    if (!leaveTypeId || !startDate || !endDate || !reason.trim()) {
      toast.error("Fill in every field");
      return;
    }
    if (endDate < startDate) {
      toast.error("End date cannot be before start date");
      return;
    }
    try {
      await createRequest.mutateAsync({
        leaveTypeId,
        startDate,
        endDate,
        reason: reason.trim(),
      });
      toast.success("Leave request submitted for approval");
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit leave request",
      );
    }
  };

  return (
    <div className="space-y-5 p-6">
      <NotchedSelectField
        label="Leave Type"
        labelClassName="bg-popover"
        value={leaveTypeId}
        onValueChange={setLeaveTypeId}
        options={types.map((t) => ({ label: t.name, value: t.id }))}
        placeholder="Select a leave type"
      />

      {selectedBalance && (
        <p className="text-xs text-muted-foreground">
          {selectedBalance.remainingDays} of {selectedBalance.allocatedDays} day
          {selectedBalance.allocatedDays === 1 ? "" : "s"} remaining this year.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <NotchedDateField
          label="Start Date"
          value={startDate}
          onValueChange={setStartDate}
        />
        <NotchedDateField
          label="End Date"
          value={endDate}
          onValueChange={setEndDate}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Reason</Label>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Why are you requesting this leave?"
          rows={3}
        />
      </div>

      <Button
        type="button"
        className="w-full gap-2 rounded-full"
        disabled={createRequest.isPending}
        onClick={handleSubmit}
      >
        Submit Request
      </Button>
    </div>
  );
}
