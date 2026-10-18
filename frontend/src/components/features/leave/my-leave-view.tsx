"use client";

import { useState } from "react";
import { AlertTriangle, CalendarOff, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useCancelMyLeaveRequest,
  useMyLeaveBalance,
  useMyLeaveRequests,
} from "@/hooks/use-leave";
import { formatDisplayDate } from "@/lib/attendance";
import { RequestLeaveDialog } from "./request-leave-dialog";
import { ResumptionReportDialog } from "./resumption-report-dialog";
import type { LeaveRequest, LeaveRequestStatus } from "@/types/leave";

const STATUS_BADGE: Record<LeaveRequestStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600",
  APPROVED: "bg-emerald-500/10 text-emerald-600",
  REJECTED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

/** The one-line explanation under an APPROVED request's badge — what's happening with its resumption right now. */
function ResumptionStatusHint({ request }: { request: LeaveRequest }) {
  if (request.isAutoExtending) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
        <AlertTriangle className="size-3" />
        Extending — not yet reported
      </span>
    );
  }
  if (request.resumptionStatus === "PENDING") {
    return (
      <span className="text-xs text-muted-foreground">
        Resumption pending admin review
      </span>
    );
  }
  if (request.resumptionStatus === "APPROVED") {
    const days = request.daysRestored ?? 0;
    if (days > 0) {
      return (
        <span className="text-xs text-emerald-600">
          {days} day{days === 1 ? "" : "s"} credited back
        </span>
      );
    }
    if (days < 0) {
      return (
        <span className="text-xs text-destructive">
          {Math.abs(days)} extra day{Math.abs(days) === 1 ? "" : "s"} deducted
        </span>
      );
    }
    return (
      <span className="text-xs text-muted-foreground">Resumed as planned</span>
    );
  }
  return <span className="text-xs text-muted-foreground">Not yet resumed</span>;
}

/** A logged-in staff member's own leave — balance per type, request history, and the actions that move a request through its lifecycle (request, cancel, submit a resumption report once back). Shown instead of the admin view when `AuthenticatedUser.staffId` is present. */
export function MyLeaveView() {
  const { data: balances = [] } = useMyLeaveBalance();
  const { data: requests = [] } = useMyLeaveRequests();
  const cancelRequest = useCancelMyLeaveRequest();

  const [requestOpen, setRequestOpen] = useState(false);
  const [resumingFor, setResumingFor] = useState<LeaveRequest | undefined>();
  const [pendingCancel, setPendingCancel] = useState<LeaveRequest | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-foreground">
          Your Leave Balance — {new Date().getFullYear()}
        </h2>
        <Button
          variant="outline"
          className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground"
          onClick={() => setRequestOpen(true)}
        >
          <Plus className="size-4" />
          Request Leave
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {balances.map((balance) => (
          <Card
            key={balance.leaveTypeId}
            className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500"
          >
            <CardContent className="flex items-start gap-3 p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                <CalendarOff className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {balance.leaveTypeName}
                </p>
                <p className="mt-0.5 text-lg font-semibold text-foreground">
                  {balance.remainingDays}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    of {balance.allocatedDays} days left
                  </span>
                </p>
                {balance.rolloverDays > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Includes {balance.rolloverDays} rolled over
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {balances.length === 0 && (
          <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
            No leave types have been set up yet.
          </p>
        )}
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardHeader>
          <p className="text-sm font-medium text-foreground">
            Your Leave Requests
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leave Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow
                  key={request.id}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="font-medium">
                    {request.leaveTypeName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDisplayDate(request.startDate)} –{" "}
                    {formatDisplayDate(request.endDate)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {request.totalDays}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge className={STATUS_BADGE[request.status]}>
                        {request.status}
                      </Badge>
                      {request.status === "APPROVED" && (
                        <span className="text-xs text-muted-foreground">
                          {request.resumedAt
                            ? "Resumption report submitted"
                            : "Resumption report pending"}
                        </span>
                      )}
                      {request.status === "REJECTED" && request.reviewNote && (
                        <span className="text-xs text-muted-foreground">
                          {request.reviewNote}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {request.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() => setPendingCancel(request)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                      >
                        Cancel
                      </button>
                    )}
                    {request.status === "APPROVED" && !request.resumedAt && (
                      <button
                        type="button"
                        onClick={() => setResumingFor(request)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-secondary transition-colors hover:bg-secondary/10"
                      >
                        Submit Resumption
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    You haven&apos;t requested any leave yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RequestLeaveDialog open={requestOpen} onOpenChange={setRequestOpen} />
      <ResumptionReportDialog
        open={!!resumingFor}
        onOpenChange={(open) => !open && setResumingFor(undefined)}
        request={resumingFor}
      />
      <ConfirmDialog
        open={!!pendingCancel}
        onOpenChange={(open) => !open && setPendingCancel(null)}
        title="Cancel this leave request?"
        description="This will withdraw your pending leave request. You can submit a new one anytime."
        confirmLabel="Cancel Request"
        variant="destructive"
        onConfirm={async () => {
          if (!pendingCancel) return;
          try {
            await cancelRequest.mutateAsync(pendingCancel.id);
            toast.success("Leave request cancelled");
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to cancel leave request",
            );
          }
        }}
      />
    </div>
  );
}
