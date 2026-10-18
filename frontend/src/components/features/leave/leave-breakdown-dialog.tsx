"use client";

import { AlertTriangle, Minus, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatShortDate } from "@/lib/attendance";
import { cn } from "@/lib/utils";
import type { LeaveBalance, LeaveRequest } from "@/types/leave";

interface LeaveBreakdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance?: LeaveBalance;
  /** Every request for this staff member — the dialog filters to this leave type and this year itself. */
  requests: LeaveRequest[];
  staffName?: string;
}

/** How many days THIS request effectively counts toward "used" — mirrors the backend's own effective-days logic closely enough to explain the number, without needing a dedicated endpoint: approved resumption adjusts by daysRestored, an unresolved auto-extension is still open-ended so shown as such rather than guessed at. */
function effectiveDaysLabel(request: LeaveRequest): {
  days: number | null;
  note?: string;
} {
  if (request.resumptionStatus === "APPROVED") {
    const restored = request.daysRestored ?? 0;
    return { days: request.totalDays - restored };
  }
  if (request.isAutoExtending) {
    return { days: null, note: "Still extending — not yet final" };
  }
  return { days: request.totalDays };
}

/** A breakdown of one leave type's balance for one staff member — the math behind the final "remaining" number, plus exactly which requests contributed to "used." Reused by both the staff self-service balance cards and the admin balances table. */
export function LeaveBreakdownDialog({
  open,
  onOpenChange,
  balance,
  requests,
  staffName,
}: LeaveBreakdownDialogProps) {
  const relevant = balance
    ? requests
        .filter((r) => r.leaveTypeId === balance.leaveTypeId)
        .filter((r) => r.status === "APPROVED")
        .filter((r) => r.startDate.slice(0, 4) === String(balance.year))
        .sort((a, b) => b.startDate.localeCompare(a.startDate))
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-3xl gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {balance?.leaveTypeName} Breakdown — {balance?.year}
            {staffName ? ` · ${staffName}` : ""}
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

        {open && balance && (
          <div className="max-h-[70vh] overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <BreakdownStat label="Allocated" value={balance.allocatedDays} />
              <BreakdownStat
                label="Rollover"
                value={balance.rolloverDays}
                prefix={balance.rolloverDays > 0 ? "+" : undefined}
                tone={balance.rolloverDays > 0 ? "positive" : "neutral"}
              />
              <BreakdownStat
                label="Used"
                value={balance.usedDays}
                prefix="−"
                tone="negative"
              />
              <BreakdownStat
                label="Remaining"
                value={balance.remainingDays}
                tone={balance.remainingDays < 0 ? "negative" : "positive"}
                emphasize
              />
            </div>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              {balance.allocatedDays} allocated
              {balance.rolloverDays > 0
                ? ` + ${balance.rolloverDays} rolled over`
                : ""}{" "}
              − {balance.usedDays} used = {balance.remainingDays} remaining
            </p>

            <h4 className="mt-6 mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              What counted toward &quot;Used&quot;
            </h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dates</TableHead>
                    <TableHead>Planned</TableHead>
                    <TableHead>Counted</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relevant.map((request) => {
                    const { days, note } = effectiveDaysLabel(request);
                    const restored = request.daysRestored ?? 0;
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="text-muted-foreground">
                          {formatShortDate(request.startDate)} –{" "}
                          {formatShortDate(request.endDate)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {request.totalDays}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {days ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {request.isAutoExtending ? (
                            <Badge className="gap-1 bg-amber-500/10 text-amber-700">
                              <AlertTriangle className="size-3 shrink-0" />
                              {note}
                            </Badge>
                          ) : restored > 0 ? (
                            <Badge className="gap-1 bg-emerald-500/10 text-emerald-600">
                              <Minus className="size-3 shrink-0" />
                              {restored} restored
                            </Badge>
                          ) : restored < 0 ? (
                            <Badge className="gap-1 bg-destructive/10 text-destructive">
                              <Plus className="size-3 shrink-0" />
                              {Math.abs(restored)} extra
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              As planned
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {relevant.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No approved leave counted against this type yet this
                        year.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BreakdownStat({
  label,
  value,
  prefix,
  tone = "neutral",
  emphasize,
}: {
  label: string;
  value: number;
  prefix?: string;
  tone?: "positive" | "negative" | "neutral";
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/40 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-semibold",
          emphasize ? "text-lg" : "text-base",
          tone === "positive" && "text-emerald-600",
          tone === "negative" && "text-destructive",
          tone === "neutral" && "text-foreground",
        )}
      >
        {prefix}
        {Math.abs(value)}
      </p>
    </div>
  );
}
