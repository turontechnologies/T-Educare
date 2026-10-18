"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NotchedField } from "@/components/shared/notched-field";
import { useCreateLeaveType, useUpdateLeaveType } from "@/hooks/use-leave";
import type { LeaveType } from "@/types/leave";

interface LeaveTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing leave type. */
  leaveType?: LeaveType;
}

export function LeaveTypeDialog({
  open,
  onOpenChange,
  leaveType,
}: LeaveTypeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {leaveType ? "Edit Leave Type" : "Add Leave Type"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {open && (
          <LeaveTypeForm
            key={leaveType?.id ?? "new"}
            leaveType={leaveType}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function LeaveTypeForm({
  leaveType,
  onDone,
}: {
  leaveType?: LeaveType;
  onDone: () => void;
}) {
  const createType = useCreateLeaveType();
  const updateType = useUpdateLeaveType();

  const [name, setName] = useState(leaveType?.name ?? "");
  const [defaultDays, setDefaultDays] = useState(
    String(leaveType?.defaultDaysPerYear ?? 21),
  );
  const [rollover, setRollover] = useState(leaveType?.rollover ?? false);
  const [maxRolloverDays, setMaxRolloverDays] = useState(
    leaveType?.maxRolloverDays != null ? String(leaveType.maxRolloverDays) : "",
  );

  const handleSubmit = async () => {
    const days = Number(defaultDays);
    if (!name.trim()) {
      toast.error("Enter a leave type name");
      return;
    }
    if (!Number.isFinite(days) || days < 0 || days > 365) {
      toast.error("Days per year must be between 0 and 365");
      return;
    }
    const maxRollover =
      rollover && maxRolloverDays.trim() ? Number(maxRolloverDays) : undefined;

    try {
      if (leaveType) {
        await updateType.mutateAsync({
          id: leaveType.id,
          payload: {
            name: name.trim(),
            defaultDaysPerYear: days,
            rollover,
            maxRolloverDays: maxRollover,
            clearMaxRolloverDays: rollover && !maxRolloverDays.trim(),
          },
        });
        toast.success(`${name.trim()} updated`);
      } else {
        await createType.mutateAsync({
          name: name.trim(),
          defaultDaysPerYear: days,
          rollover,
          maxRolloverDays: maxRollover,
        });
        toast.success(`${name.trim()} added`);
      }
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save leave type",
      );
    }
  };

  return (
    <div className="space-y-5 p-6">
      <NotchedField
        label="Leave Type Name"
        labelClassName="bg-popover"
        placeholder="e.g. Annual Leave"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <NotchedField
        label="Default Days Per Year"
        labelClassName="bg-popover"
        type="number"
        min={0}
        max={365}
        value={defaultDays}
        onChange={(event) => setDefaultDays(event.target.value)}
      />

      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
        <Checkbox
          checked={rollover}
          onCheckedChange={(checked) => setRollover(checked === true)}
        />
        Unused days roll over into next year
      </label>

      {rollover && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Max rollover days (optional — leave blank for no cap)
          </Label>
          <NotchedField
            label="Max Rollover Days"
            labelClassName="bg-popover"
            type="number"
            min={0}
            placeholder="No cap"
            value={maxRolloverDays}
            onChange={(event) => setMaxRolloverDays(event.target.value)}
          />
        </div>
      )}

      <Button
        type="button"
        className="w-full gap-2 rounded-full"
        disabled={createType.isPending || updateType.isPending}
        onClick={handleSubmit}
      >
        Save
      </Button>
    </div>
  );
}
