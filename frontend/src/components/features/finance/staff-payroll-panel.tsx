"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PayrollProfileDialog } from "./payroll-profile-dialog";
import { RunPayrollDialog } from "./run-payroll-dialog";
import { ViewPayslipDialog } from "./view-payslip-dialog";
import { usePayroll } from "@/hooks/use-finance";
import type { PayrollRow } from "@/types/finance";

const PAGE_SIZE_OPTIONS = ["10", "25", "50"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const STATUS_BADGE: Record<string, string> = {
  ON_HOLD: "bg-muted text-muted-foreground",
  PENDING: "bg-amber-500/10 text-amber-600",
  PAID: "bg-emerald-500/10 text-emerald-600",
};
const STATUS_LABEL: Record<string, string> = {
  ON_HOLD: "On hold",
  PENDING: "Pending",
  PAID: "Paid",
};

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function StaffPayrollPanel() {
  const now = new Date();
  const [periodYear, setPeriodYear] = useState(now.getFullYear());
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const { data: rows = [] } = usePayroll(periodYear, periodMonth);

  const [runOpen, setRunOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<
    PayrollRow | undefined
  >();
  const [viewingPayslip, setViewingPayslip] = useState<
    PayrollRow | undefined
  >();

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);

  const alreadyRun = rows.some((r) => r.status === "PAID");
  const netPayroll = rows.reduce(
    (sum, r) => sum + (r.status !== "ON_HOLD" ? r.netPay : 0),
    0,
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (r) =>
        r.staffName.toLowerCase().includes(query) ||
        r.staffCode.toLowerCase().includes(query),
    );
  }, [rows, search]);

  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * size,
    currentPage * size,
  );
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * size + 1;
  const rangeEnd = Math.min(currentPage * size, filtered.length);

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - 1 + i);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 rounded-md py-1.5 text-xs"
          >
            Period: {MONTH_NAMES[periodMonth - 1]} {periodYear}
          </Badge>
          <Badge
            variant="outline"
            className="gap-1.5 rounded-md py-1.5 text-xs"
          >
            Staff: {rows.length}
          </Badge>
          <Badge
            variant="outline"
            className="gap-1.5 rounded-md py-1.5 text-xs"
          >
            Net payroll: {formatNaira(netPayroll)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(periodMonth)}
            onValueChange={(value) => value && setPeriodMonth(Number(value))}
            items={MONTH_NAMES.map((m, i) => ({
              label: m,
              value: String(i + 1),
            }))}
          >
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(periodYear)}
            onValueChange={(value) => value && setPeriodYear(Number(value))}
          >
            <SelectTrigger size="sm" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="gap-1.5 rounded-md"
            disabled={alreadyRun || rows.length === 0}
            onClick={() => setRunOpen(true)}
          >
            <Play className="size-4" />
            Run Payroll
          </Button>
        </div>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
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
            <Label htmlFor="payroll-search" className="text-muted-foreground">
              Search:
            </Label>
            <Input
              id="payroll-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="h-8 w-56"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff ID</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((row) => (
                <TableRow
                  key={row.staffId}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {row.staffCode}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">
                      {row.staffName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.designationName}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.departmentName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatNaira(row.basicPay)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatNaira(row.allowances)}
                  </TableCell>
                  <TableCell className="text-destructive">
                    −{formatNaira(row.deductions)}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {formatNaira(row.netPay)}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_BADGE[row.status]}>
                      {STATUS_LABEL[row.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Actions for ${row.staffName}`}
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => setViewingPayslip(row)}
                        >
                          View payslip
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setEditingProfile(row)}
                        >
                          Edit profile
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No staff found.
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
      </Card>

      <RunPayrollDialog
        open={runOpen}
        onOpenChange={setRunOpen}
        periodYear={periodYear}
        periodMonth={periodMonth}
        rows={rows}
      />
      <PayrollProfileDialog
        row={editingProfile}
        onOpenChange={(open) => !open && setEditingProfile(undefined)}
      />
      <ViewPayslipDialog
        row={viewingPayslip}
        onOpenChange={(open) => !open && setViewingPayslip(undefined)}
      />
    </div>
  );
}
