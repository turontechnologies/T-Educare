"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLeaveBalances } from "@/hooks/use-leave";
import { cn } from "@/lib/utils";

export function LeaveBalancesPanel() {
  const { data: staffBalances = [] } = useLeaveBalances();

  const rows = staffBalances.flatMap((staff) =>
    staff.balances.map((balance) => ({ staff, balance })),
  );

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
      <CardHeader>
        <p className="text-sm font-medium text-foreground">
          Staff Leave Balances — {new Date().getFullYear()}
        </p>
        <p className="text-xs text-muted-foreground">
          Allocated and remaining days per staff member, per leave type.
          Computed live from approved requests — never a stored number that can
          drift.
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Allocated</TableHead>
              <TableHead>Rollover</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Remaining</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ staff, balance }) => (
              <TableRow
                key={`${staff.staffId}-${balance.leaveTypeId}`}
                className="animate-in fade-in duration-300"
              >
                <TableCell>
                  <p className="font-medium text-foreground">
                    {staff.staffName}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {staff.staffCode}
                  </p>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {balance.leaveTypeName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {balance.allocatedDays}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {balance.rolloverDays > 0 ? `+${balance.rolloverDays}` : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {balance.usedDays}
                </TableCell>
                <TableCell
                  className={cn(
                    "font-medium",
                    balance.remainingDays < 0
                      ? "text-destructive"
                      : "text-emerald-600",
                  )}
                >
                  {balance.remainingDays}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No leave types configured yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
