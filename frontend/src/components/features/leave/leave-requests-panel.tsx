"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLeaveRequests } from "@/hooks/use-leave";
import { formatDisplayDate } from "@/lib/attendance";
import { ReviewLeaveRequestDialog } from "./review-leave-request-dialog";
import type { LeaveRequest, LeaveRequestStatus } from "@/types/leave";

const STATUS_BADGE: Record<LeaveRequestStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600",
  APPROVED: "bg-emerald-500/10 text-emerald-600",
  REJECTED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "All", value: "" },
];

export function LeaveRequestsPanel() {
  const [status, setStatus] = useState("PENDING");
  const { data: requests = [] } = useLeaveRequests(status ? { status } : {});

  const [reviewing, setReviewing] = useState<
    { request: LeaveRequest; action: "approve" | "reject" } | undefined
  >();

  return (
    <div className="space-y-4">
      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              Leave Requests
            </p>
            <p className="text-xs text-muted-foreground">
              Review and act on staff leave requests.
            </p>
          </div>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value ?? "")}
            items={STATUS_FILTERS}
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((option) => (
                <SelectItem key={option.value || "all"} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resumed</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow
                  key={request.id}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell>
                    <p className="font-medium text-foreground">
                      {request.staffName}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {request.staffCode}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
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
                    <Badge className={STATUS_BADGE[request.status]}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {request.resumedAt
                      ? "Yes"
                      : request.status === "APPROVED"
                        ? "Not yet"
                        : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {request.status === "PENDING" && (
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setReviewing({ request, action: "approve" })
                          }
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10"
                        >
                          <Check className="size-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setReviewing({ request, action: "reject" })
                          }
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <X className="size-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No leave requests here.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ReviewLeaveRequestDialog
        open={!!reviewing}
        onOpenChange={(open) => !open && setReviewing(undefined)}
        request={reviewing?.request}
        action={reviewing?.action}
      />
    </div>
  );
}
