"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApproveResumption, useRejectResumption } from "@/hooks/use-leave";
import { formatDisplayDate } from "@/lib/attendance";
import type { LeaveRequest } from "@/types/leave";

interface ReviewResumptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: LeaveRequest;
  action?: "approve" | "reject";
}

/** Admin confirms (or disputes) a staff member's claimed resumption date — the action that actually credits unused days back or confirms extra ones used. */
export function ReviewResumptionDialog({
  open,
  onOpenChange,
  request,
  action,
}: ReviewResumptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div
          className={`flex items-center justify-between px-6 py-4 ${action === "reject" ? "bg-destructive" : "bg-primary"}`}
        >
          <DialogTitle className="text-base font-medium text-white">
            {action === "reject" ? "Dispute Resumption" : "Confirm Resumption"}
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

        {open && request && action && (
          <ReviewForm
            key={request.id}
            request={request}
            action={action}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewForm({
  request,
  action,
  onDone,
}: {
  request: LeaveRequest;
  action: "approve" | "reject";
  onDone: () => void;
}) {
  const approve = useApproveResumption();
  const reject = useRejectResumption();
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    if (action === "reject" && !note.trim()) {
      toast.error("A reason is required to dispute a resumption report");
      return;
    }
    try {
      if (action === "approve") {
        await approve.mutateAsync({
          id: request.id,
          note: note.trim() || undefined,
        });
        toast.success(`${request.staffName}'s resumption confirmed`);
      } else {
        await reject.mutateAsync({ id: request.id, note: note.trim() });
        toast.success(`${request.staffName}'s resumption report disputed`);
      }
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to review this resumption report",
      );
    }
  };

  return (
    <div className="space-y-5 p-6">
      <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
        <p className="font-medium text-foreground">
          {request.staffName} ({request.staffCode})
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {request.leaveTypeName} · Leave:{" "}
          {formatDisplayDate(request.startDate)} –{" "}
          {formatDisplayDate(request.endDate)} ({request.totalDays} workday
          {request.totalDays === 1 ? "" : "s"} planned)
        </p>
        <p className="mt-2 text-xs font-medium text-foreground">
          Claims resumed:{" "}
          {request.resumptionDate && formatDisplayDate(request.resumptionDate)}
        </p>
        {request.isAutoExtending && (
          <Badge className="mt-2 bg-amber-500/10 text-amber-700">
            Reported late — appeal
          </Badge>
        )}
        {request.resumptionLateReason && (
          <p className="mt-2 text-xs text-foreground">
            <span className="font-medium">Reason for delay: </span>
            {request.resumptionLateReason}
          </p>
        )}
        {request.resumptionNote && (
          <p className="mt-2 text-xs text-foreground">
            <span className="font-medium">Note: </span>
            {request.resumptionNote}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          {action === "reject"
            ? "Reason for disputing this date (required)"
            : "Note (optional)"}
        </Label>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={
            action === "reject"
              ? "Why do you dispute the claimed resumption date?"
              : "Any note for the record"
          }
          rows={3}
        />
      </div>

      <Button
        type="button"
        className="w-full gap-2 rounded-full"
        variant={action === "reject" ? "destructive" : "default"}
        disabled={approve.isPending || reject.isPending}
        onClick={handleSubmit}
      >
        {action === "reject" ? "Dispute Resumption" : "Confirm Resumption"}
      </Button>
    </div>
  );
}
