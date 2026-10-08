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
import { NotchedField } from "@/components/shared/notched-field";
import { useStartGracePeriod } from "@/hooks/use-institutions";
import type { Institution } from "@/types/institution";

const DEFAULT_GRACE_DAYS = 14;

interface GracePeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution: Institution | null;
}

/** Manually places an institution into a grace period (payment default / license expiry) — the scheduled backend sweep suspends it automatically once graceEndsAt passes. Distinct from "Revoke license" (that resets to the unlicensed Basic tier instead). */
export function GracePeriodDialog({
  open,
  onOpenChange,
  institution,
}: GracePeriodDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Start Grace Period
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {open && institution && (
          <GracePeriodForm
            key={institution.id}
            institution={institution}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function GracePeriodForm({
  institution,
  onDone,
}: {
  institution: Institution;
  onDone: () => void;
}) {
  const startGracePeriod = useStartGracePeriod();
  const [reason, setReason] = useState("");
  const [graceDays, setGraceDays] = useState(String(DEFAULT_GRACE_DAYS));

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Enter a reason for the grace period");
      return;
    }
    const parsedDays = Number(graceDays);
    if (!Number.isInteger(parsedDays) || parsedDays <= 0) {
      toast.error("Grace days must be a positive whole number");
      return;
    }

    try {
      await startGracePeriod.mutateAsync({
        id: institution.id,
        payload: { reason: reason.trim(), graceDays: parsedDays },
      });
      toast.success(`${institution.name} is now in a grace period`);
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start grace period",
      );
    }
  };

  return (
    <>
      <div className="space-y-5 p-6">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {institution.name}
          </span>{" "}
          will keep access during the grace period. If it isn&apos;t renewed
          before the deadline, the backend will automatically suspend it.
        </p>

        <NotchedField
          label="Reason"
          labelClassName="bg-popover"
          placeholder="e.g. Payment default on renewal invoice"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />

        <NotchedField
          label="Grace period (days)"
          labelClassName="bg-popover"
          type="number"
          min={1}
          value={graceDays}
          onChange={(event) => setGraceDays(event.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          disabled={startGracePeriod.isPending}
          onClick={handleSubmit}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Start Grace Period
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
