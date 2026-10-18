"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitResumption } from "@/hooks/use-leave";
import { formatDisplayDate } from "@/lib/attendance";
import type { LeaveRequest } from "@/types/leave";

interface ResumptionReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: LeaveRequest;
}

/** A staff member's own report that they've resumed duty after approved leave — the admin sees it on the request, and Attendance stops reading this period as leave from the next clock-in. */
export function ResumptionReportDialog({
  open,
  onOpenChange,
  request,
}: ResumptionReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Resumption Report
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
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ResumptionForm({
  request,
  onDone,
}: {
  request: LeaveRequest;
  onDone: () => void;
}) {
  const submitResumption = useSubmitResumption();
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    if (!note.trim()) {
      toast.error("Enter a resumption note");
      return;
    }
    try {
      await submitResumption.mutateAsync({ id: request.id, note: note.trim() });
      toast.success("Resumption report submitted");
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
      <p className="text-xs text-muted-foreground">
        Confirming you&apos;ve resumed duty after your{" "}
        <span className="font-medium text-foreground">
          {request.leaveTypeName}
        </span>{" "}
        from {formatDisplayDate(request.startDate)} to{" "}
        {formatDisplayDate(request.endDate)}.
      </p>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Resumption Note</Label>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. Resumed duties, handover complete."
          rows={3}
        />
      </div>

      <Button
        type="button"
        className="w-full gap-2 rounded-full"
        disabled={submitResumption.isPending}
        onClick={handleSubmit}
      >
        Submit Report
      </Button>
    </div>
  );
}
