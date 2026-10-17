"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NotchedDateField } from "@/components/shared/notched-field";
import {
  useMyAttendanceHistory,
  useMyAttendanceToday,
} from "@/hooks/use-attendance";
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  formatClockTime,
  todayIsoDate,
} from "@/lib/attendance";

/** A logged-in staff member's own clock-in/clock-out record — shown instead of the admin overview when `AuthenticatedUser.staffId` is present. They can never see another staff member's times; the backend resolves `staffId` from their own session, never from a client-supplied value. */
export function MyAttendanceView() {
  const { data: today = [] } = useMyAttendanceToday();
  const [from, setFrom] = useState(
    format(subDays(new Date(), 13), "yyyy-MM-dd"),
  );
  const [to, setTo] = useState(todayIsoDate());
  const { data: history = [] } = useMyAttendanceHistory(from, to);

  const todayEntry = today[0];

  return (
    <div className="space-y-6">
      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both border-secondary/30 bg-secondary/5 duration-500">
        <CardContent className="flex items-start gap-4 p-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
            <Clock className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Today&apos;s Status
            </p>
            {todayEntry ? (
              <>
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge className={STATUS_BADGE_CLASSES[todayEntry.status]}>
                    {STATUS_LABELS[todayEntry.status]}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Clock In: {formatClockTime(todayEntry.clockInAt)} · Clock Out:{" "}
                  {formatClockTime(todayEntry.clockOutAt)}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                Nothing recorded for today yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              Your Attendance History
            </p>
            <p className="text-xs text-muted-foreground">
              Only your own clock-in and clock-out times — never another staff
              member&apos;s.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotchedDateField
              label="From"
              value={from}
              onValueChange={setFrom}
            />
            <NotchedDateField label="To" value={to} onValueChange={setTo} />
          </div>
        </CardHeader>
        <CardContent>
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
              {history.map((entry, index) => (
                <TableRow key={`${entry.staffId}-${index}`}>
                  <TableCell className="text-muted-foreground">
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
              {history.length === 0 && (
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
        </CardContent>
      </Card>
    </div>
  );
}
