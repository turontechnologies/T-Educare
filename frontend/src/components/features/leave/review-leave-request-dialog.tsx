"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useApproveLeaveRequest,
  useRejectLeaveRequest,
} from "@/hooks/use-leave";
import { formatDisplayDate } from "@/lib/attendance";
import type { LeaveRequest } from "@/types/leave";

interface ReviewLeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: LeaveRequest;
  action?: "approve" | "reject";
}

export function ReviewLeaveRequestDialog({
  open,
  onOpenChange,
  request,
  action,
}: ReviewLeaveRequestDialogProps) {
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
            {action === "reject"
              ? "Reject Leave Request"
              : "Approve Leave Request"}
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
  const approve = useApproveLeaveRequest();
  const reject = useRejectLeaveRequest();
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    if (action === "reject" && !note.trim()) {
      toast.error("A reason is required to reject a leave request");
      return;
    }
    try {
      if (action === "approve") {
        await approve.mutateAsync({
          id: request.id,
          note: note.trim() || undefined,
        });
        toast.success(`${request.staffName}'s leave request approved`);
      } else {
        await reject.mutateAsync({ id: request.id, note: note.trim() });
        toast.success(`${request.staffName}'s leave request rejected`);
      }
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to review this request",
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
          {request.leaveTypeName} · {formatDisplayDate(request.startDate)} –{" "}
          {formatDisplayDate(request.endDate)} · {request.totalDays} workday
          {request.totalDays === 1 ? "" : "s"}
        </p>
        <p className="mt-2 text-xs text-foreground">{request.reason}</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          {action === "reject"
            ? "Reason for rejection (required)"
            : "Note (optional)"}
        </Label>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={
            action === "reject"
              ? "Why is this request being rejected?"
              : "Any note for the staff member"
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
        {action === "reject" ? "Reject Request" : "Approve Request"}
      </Button>
    </div>
  );
}
