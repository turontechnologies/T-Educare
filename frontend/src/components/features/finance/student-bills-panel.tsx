"use client";

import { useMemo, useState } from "react";
import { CreditCard, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { TablePagination } from "@/components/shared/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { ViewLedgerDialog } from "./view-ledger-dialog";
import { useStudentBills } from "@/hooks/use-finance";
import type { StudentBillSummary } from "@/types/finance";

const PAGE_SIZE_OPTIONS = ["10", "25", "50"];

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function StudentBillsPanel() {
  const { data: bills = [] } = useStudentBills();
  const [recordingFor, setRecordingFor] = useState<
    StudentBillSummary | undefined
  >();
  const [ledgerFor, setLedgerFor] = useState<StudentBillSummary | undefined>();

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);

  const totals = useMemo(
    () => ({
      students: bills.length,
      billed: bills.reduce((sum, b) => sum + b.totalBilled, 0),
      paid: bills.reduce((sum, b) => sum + b.totalPaid, 0),
      balance: bills.reduce((sum, b) => sum + b.balance, 0),
    }),
    [bills],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bills
      .filter((b) => statusFilter === "ALL" || b.status === statusFilter)
      .filter(
        (b) =>
          !query ||
          b.studentName.toLowerCase().includes(query) ||
          b.matricNo.toLowerCase().includes(query),
      );
  }, [bills, statusFilter, search]);

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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="gap-1.5 rounded-md py-1.5 text-xs">
          Students: {totals.students}
        </Badge>
        <Badge variant="outline" className="gap-1.5 rounded-md py-1.5 text-xs">
          Billed: {formatNaira(totals.billed)}
        </Badge>
        <Badge variant="outline" className="gap-1.5 rounded-md py-1.5 text-xs">
          Paid: {formatNaira(totals.paid)}
        </Badge>
        <Badge variant="outline" className="gap-1.5 rounded-md py-1.5 text-xs">
          Balance: {formatNaira(totals.balance)}
        </Badge>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
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
              <Label className="text-muted-foreground">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  if (value) {
                    setStatusFilter(value);
                    setPage(1);
                  }
                }}
                items={[
                  { label: "All statuses", value: "ALL" },
                  { label: "Owing", value: "OWING" },
                  { label: "Paid", value: "PAID" },
                ]}
              >
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="OWING">Owing</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Label
              htmlFor="student-bills-search"
              className="text-muted-foreground"
            >
              Search:
            </Label>
            <Input
              id="student-bills-search"
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
                <TableHead>Matric No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Total Billed</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((bill) => (
                <TableRow
                  key={bill.studentId}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {bill.matricNo}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {bill.studentName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {bill.departmentName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatNaira(bill.totalBilled)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatNaira(bill.totalPaid)}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {formatNaira(bill.balance)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        bill.status === "OWING"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-emerald-500/10 text-emerald-600"
                      }
                    >
                      {bill.status === "OWING" ? "Owing" : "Paid"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setRecordingFor(bill)}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-secondary hover:underline"
                      >
                        <CreditCard className="size-3.5" />
                        Record payment
                      </button>
                      <button
                        type="button"
                        onClick={() => setLedgerFor(bill)}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
                      >
                        <FileText className="size-3.5" />
                        View ledger
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No student bills yet.
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

      <RecordPaymentDialog
        bill={recordingFor}
        onOpenChange={(open) => !open && setRecordingFor(undefined)}
      />
      <ViewLedgerDialog
        bill={ledgerFor}
        onOpenChange={(open) => !open && setLedgerFor(undefined)}
      />
    </div>
  );
}
