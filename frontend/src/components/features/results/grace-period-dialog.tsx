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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NotchedDateField } from "@/components/shared/notched-field";
import {
  useGracePeriod,
  useUpdateGracePeriod,
} from "@/hooks/use-course-results";

interface GracePeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GracePeriodDialog({
  open,
  onOpenChange,
}: GracePeriodDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Grace Period Settings
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
        {open && <GracePeriodForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function GracePeriodForm({ onDone }: { onDone: () => void }) {
  const { data: gracePeriod } = useGracePeriod();
  const updateGracePeriod = useUpdateGracePeriod();

  const [deadlineDate, setDeadlineDate] = useState(
    gracePeriod?.deadlineDate ?? "",
  );
  const [gracePeriodDays, setGracePeriodDays] = useState(
    gracePeriod ? String(gracePeriod.gracePeriodDays) : "",
  );

  const handleSave = async () => {
    if (!deadlineDate) {
      toast.error("Deadline date is required");
      return;
    }
    const days = Number(gracePeriodDays);
    if (!Number.isFinite(days) || days < 0) {
      toast.error("Grace period must be a non-negative number of days");
      return;
    }
    try {
      await updateGracePeriod.mutateAsync({
        deadlineDate,
        gracePeriodDays: days,
      });
      toast.success("Grace period settings updated");
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save grace period",
      );
    }
  };

  return (
    <>
      <div className="space-y-5 p-6">
        <NotchedDateField
          label="Deadline Date"
          labelClassName="bg-popover"
          value={deadlineDate}
          onValueChange={setDeadlineDate}
        />
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Grace Period (In Days)
          </Label>
          <Input
            type="number"
            min={0}
            value={gracePeriodDays}
            onChange={(event) => setGracePeriodDays(event.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          disabled={updateGracePeriod.isPending}
          onClick={handleSave}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Save
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
