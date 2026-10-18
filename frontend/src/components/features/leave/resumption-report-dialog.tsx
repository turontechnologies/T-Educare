"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NotchedDateField } from "@/components/shared/notched-field";
import { useSubmitResumption } from "@/hooks/use-leave";
import { formatDisplayDate, todayIsoDate } from "@/lib/attendance";
import type { LeaveRequest } from "@/types/leave";

interface ResumptionReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: LeaveRequest;
}

/**
 * A staff member's own report of their actual resumption date. Doubles as
 * the appeal mechanism once `request.isAutoExtending` is true — the leave's
 * end date has already passed with nobody reporting a return, so the system
 * has been counting every day since as extended leave and deducting for
 * it. Either way this only takes effect once an admin approves it (see
 * `ReviewLeaveRequestDialog`-equivalent on the admin side); submitting here
 * doesn't move any balance by itself.
 */
export function ResumptionReportDialog({
  open,
  onOpenChange,
  request,
}: ResumptionReportDialogProps) {
  const isAppeal = request?.isAutoExtending ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div
          className={`flex items-center justify-between px-6 py-4 ${isAppeal ? "bg-amber-600" : "bg-primary"}`}
        >
          <DialogTitle className="text-base font-medium text-white">
            {isAppeal ? "Appeal — Report Resumption" : "Resumption Report"}
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

        {open && request && (
          <ResumptionForm
            key={request.id}
            request={request}
            isAppeal={isAppeal}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ResumptionForm({
  request,
  isAppeal,
  onDone,
}: {
  request: LeaveRequest;
  isAppeal: boolean;
  onDone: () => void;
}) {
  const submitResumption = useSubmitResumption();
  const [resumptionDate, setResumptionDate] = useState(
    request.resumptionDate || todayIsoDate(),
  );
  const [note, setNote] = useState("");
  const [lateReason, setLateReason] = useState("");

  const handleSubmit = async () => {
    if (!resumptionDate) {
      toast.error("Select the date you resumed");
      return;
    }
    if (!note.trim()) {
      toast.error("Enter a resumption note");
      return;
    }
    if (isAppeal && !lateReason.trim()) {
      toast.error("Explain why this wasn't reported sooner");
      return;
    }
    try {
      await submitResumption.mutateAsync({
        id: request.id,
        payload: {
          resumptionDate,
          note: note.trim(),
          lateReason: isAppeal ? lateReason.trim() : undefined,
        },
      });
      toast.success(
        isAppeal
          ? "Appeal submitted for admin review"
          : "Resumption report submitted",
      );
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit resumption report",
      );
    }
  };

  return (
    <div className="space-y-5 p-6">
      {isAppeal && (
        <div className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-xs font-medium text-amber-700">
            This leave&apos;s end date has already passed with no resumption
            reported, so it has been counted as extended and deducted from your
            balance. Submitting this will ask your admin to review and correct
            it.
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        For your{" "}
        <span className="font-medium text-foreground">
          {request.leaveTypeName}
        </span>{" "}
        from {formatDisplayDate(request.startDate)} to{" "}
        {formatDisplayDate(request.endDate)} — enter the date you actually
        resumed duty (your first day back at work).
      </p>

      <NotchedDateField
        label="Resumption Date"
        value={resumptionDate}
        onValueChange={setResumptionDate}
      />

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Resumption Note</Label>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. Resumed duties, handover complete."
          rows={3}
        />
      </div>

      {isAppeal && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Why wasn&apos;t this reported sooner? (required)
          </Label>
          <Textarea
            value={lateReason}
            onChange={(event) => setLateReason(event.target.value)}
            placeholder="Explain the delay"
            rows={2}
          />
        </div>
      )}

      <Button
        type="button"
        className="w-full gap-2 rounded-full"
        disabled={submitResumption.isPending}
        onClick={handleSubmit}
      >
        {isAppeal ? "Submit Appeal" : "Submit Report"}
      </Button>
    </div>
  );
}
