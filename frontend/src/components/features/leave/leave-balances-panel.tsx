"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { TablePagination } from "@/components/shared/table-pagination";
import { useLeaveBalances, useLeaveRequests } from "@/hooks/use-leave";
import { cn } from "@/lib/utils";
import { LeaveBreakdownDialog } from "./leave-breakdown-dialog";
import type { LeaveBalance } from "@/types/leave";

const PAGE_SIZE_OPTIONS = ["10", "25", "50"];

export function LeaveBalancesPanel() {
  const { data: staffBalances = [] } = useLeaveBalances();
  const [breakdownFor, setBreakdownFor] = useState<
    { staffId: string; staffName: string; balance: LeaveBalance } | undefined
  >();

  const { data: breakdownRequests = [] } = useLeaveRequests(
    breakdownFor ? { staffId: breakdownFor.staffId } : {},
    { enabled: !!breakdownFor },
  );

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);

  const allRows = useMemo(
    () =>
      staffBalances.flatMap((staff) =>
        staff.balances.map((balance) => ({ staff, balance })),
      ),
    [staffBalances],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allRows;
    return allRows.filter(
      ({ staff, balance }) =>
        staff.staffName.toLowerCase().includes(query) ||
        staff.staffCode.toLowerCase().includes(query) ||
        balance.leaveTypeName.toLowerCase().includes(query),
    );
  }, [allRows, search]);

  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * size,
    currentPage * size,
  );
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * size + 1;
  const rangeEnd = Math.min(currentPage * size, filtered.length);

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
      <CardHeader className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">
            Staff Leave Balances — {new Date().getFullYear()}
          </p>
          <p className="text-xs text-muted-foreground">
            Computed live from approved requests. Click a row for the full
            breakdown.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Show</span>
            <Select
              value={pageSize}
              onValueChange={(value) => {
                if (value) {
                  setPageSize(value);
                  setPage(1);
                }
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Label
              htmlFor="leave-balances-search"
              className="text-muted-foreground"
            >
              Filter:
            </Label>
            <Input
              id="leave-balances-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Staff name, code, or leave type"
              className="h-8 w-56"
            />
          </div>
        </div>
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
            {paginated.map(({ staff, balance }) => (
              <TableRow
                key={`${staff.staffId}-${balance.leaveTypeId}`}
                onClick={() =>
                  setBreakdownFor({
                    staffId: staff.staffId,
                    staffName: staff.staffName,
                    balance,
                  })
                }
                className="animate-in fade-in cursor-pointer duration-300 hover:bg-muted/50"
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
            {paginated.length === 0 && (
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

        <TablePagination
          page={currentPage}
          totalPages={totalPages}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          totalCount={filtered.length}
          onPageChange={setPage}
        />
      </CardContent>

      <LeaveBreakdownDialog
        open={!!breakdownFor}
        onOpenChange={(open) => !open && setBreakdownFor(undefined)}
        balance={breakdownFor?.balance}
        requests={breakdownRequests}
        staffName={breakdownFor?.staffName}
      />
    </Card>
  );
}
