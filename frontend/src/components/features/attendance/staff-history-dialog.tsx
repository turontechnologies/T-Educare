"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import { X } from "lucide-react";
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
import { NotchedDateField } from "@/components/shared/notched-field";
import { useStaffAttendanceHistory } from "@/hooks/use-attendance";
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  formatClockTime,
  todayIsoDate,
} from "@/lib/attendance";

interface StaffHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId?: string;
  staffName?: string;
}

/** An admin's drill-down into one staff member's clock history over a date range — distinct from the "today" overview, which shows every staff member at once. */
export function StaffHistoryDialog({
  open,
  onOpenChange,
  staffId,
  staffName,
}: StaffHistoryDialogProps) {
  const [from, setFrom] = useState(
    format(subDays(new Date(), 6), "yyyy-MM-dd"),
  );
  const [to, setTo] = useState(todayIsoDate());

  const { data: entries = [], isLoading } = useStaffAttendanceHistory(
    staffId,
    from,
    to,
    { enabled: open && !!staffId },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-2xl gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {staffName ?? "Staff"} — Attendance History
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

        <div className="max-h-[70vh] overflow-y-auto p-6">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <NotchedDateField
              label="From"
              value={from}
              onValueChange={setFrom}
            />
            <NotchedDateField label="To" value={to} onValueChange={setTo} />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow key={`${entry.staffId}-${index}`}>
                    <TableCell className="text-muted-foreground">
                      {/* The backend returns one entry per day in range, in order — index maps directly back to the from-date offset. */}
                      {format(
                        new Date(
                          new Date(`${from}T00:00:00`).getTime() +
                            index * 86_400_000,
                        ),
                        "d MMM yyyy",
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE_CLASSES[entry.status]}>
                        {STATUS_LABELS[entry.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatClockTime(entry.clockInAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatClockTime(entry.clockOutAt)}
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && entries.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No records in this range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
