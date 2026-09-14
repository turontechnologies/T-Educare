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
import { ROLLOVER_DECISION_LABELS } from "@/lib/rollover";
import { ROLLOVER_DECISIONS, type RolloverDecision } from "@/types/rollover";

const DECISION_OPTIONS = ROLLOVER_DECISIONS.map((value) => ({
  value,
  label: ROLLOVER_DECISION_LABELS[value],
}));

interface RolloverOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  currentDecision: RolloverDecision;
  onConfirm: (decision: RolloverDecision, reason: string | undefined) => void;
}

/** A student's proposed rollover decision is engine-suggested by default — this is how an admin overrides it, with a required reason whenever the new decision differs from the suggestion. */
export function RolloverOverrideDialog({
  open,
  onOpenChange,
  studentName,
  currentDecision,
  onConfirm,
}: RolloverOverrideDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-sm gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Override Decision
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
        {open && (
          <OverrideForm
            studentName={studentName}
            currentDecision={currentDecision}
            onConfirm={(decision, reason) => {
              onConfirm(decision, reason);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function OverrideForm({
  studentName,
  currentDecision,
  onConfirm,
}: {
  studentName: string;
  currentDecision: RolloverDecision;
  onConfirm: (decision: RolloverDecision, reason: string | undefined) => void;
}) {
  const [decision, setDecision] = useState<RolloverDecision>(currentDecision);
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (decision !== currentDecision && !reason.trim()) {
      toast.error("A reason is required when changing the decision");
      return;
    }
    onConfirm(
      decision,
      decision !== currentDecision ? reason.trim() : undefined,
    );
  };

  return (
    <>
      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">
          Changing the rollover decision for{" "}
          <span className="font-medium text-foreground">{studentName}</span>.
        </p>
        <NotchedSelectField
          label="Decision"
          labelClassName="bg-popover"
          value={decision}
          onValueChange={(value) => setDecision(value as RolloverDecision)}
          options={DECISION_OPTIONS}
        />
        {decision !== currentDecision && (
          <NotchedField
            label="Reason for override"
            labelClassName="bg-popover"
            placeholder="e.g. Academic board approved progression despite outstanding course."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        )}
      </div>
      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          onClick={handleSubmit}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Apply
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
