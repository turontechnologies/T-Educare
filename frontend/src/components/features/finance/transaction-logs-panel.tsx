"use client";

import { useMemo, useState } from "react";
import { Lock, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useTransactionLog } from "@/hooks/use-finance";

const PAGE_SIZE_OPTIONS = ["25", "50", "100"];

const EVENT_LABEL: Record<string, string> = {
  PAYMENT_RECORDED: "Payment recorded",
  GATEWAY_PAYMENT_RECEIVED: "Gateway payment received",
  PAYMENT_ALLOCATED: "Payment allocated",
  PAYROLL_RUN: "Payroll run",
};
const EVENT_BADGE: Record<string, string> = {
  PAYMENT_RECORDED: "bg-secondary/10 text-secondary",
  GATEWAY_PAYMENT_RECEIVED: "bg-emerald-500/10 text-emerald-600",
  PAYMENT_ALLOCATED: "bg-primary/10 text-primary",
  PAYROLL_RUN: "bg-amber-500/10 text-amber-600",
};

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function TransactionLogsPanel() {
  const { data: entries = [] } = useTransactionLog();

  const [eventFilter, setEventFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("25");
  const [page, setPage] = useState(1);

  const eventOptions = useMemo(
    () => Array.from(new Set(entries.map((e) => e.eventType))),
    [entries],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries
      .filter((e) => eventFilter === "ALL" || e.eventType === eventFilter)
      .filter(
        (e) =>
          !query ||
          e.details.toLowerCase().includes(query) ||
          (e.studentName ?? "").toLowerCase().includes(query) ||
          (e.reference ?? "").toLowerCase().includes(query),
      );
  }, [entries, eventFilter, search]);

  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * size,
    currentPage * size,
  );
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * size + 1;
  const rangeEnd = Math.min(currentPage * size, filtered.length);

  const handleExport = () => {
    const header = [
      "Date & Time",
      "Event",
      "Student",
      "Details",
      "Amount",
      "Reference",
      "Recorded By",
    ];
    const rows = filtered.map((e) => [
      new Date(e.createdAt).toISOString(),
      EVENT_LABEL[e.eventType] ?? e.eventType,
      e.studentName ? `${e.studentName} (${e.studentMatricNo})` : "",
      e.details,
      e.amount != null ? String(e.amount) : "",
      e.reference ?? "",
      e.recordedByName,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transaction-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md bg-secondary/10 px-4 py-3 text-sm text-secondary">
        <Lock className="mt-0.5 size-4 shrink-0" />
        <p>
          This log is read-only. Entries can&apos;t be edited or deleted.
          Corrections are recorded as new entries, so this is the record
          disputes are settled against.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Label className="text-muted-foreground">Event</Label>
          <Select
            value={eventFilter}
            onValueChange={(value) => {
              if (value) {
                setEventFilter(value);
                setPage(1);
              }
            }}
            items={[
              { label: "All events", value: "ALL" },
              ...eventOptions.map((e) => ({
                label: EVENT_LABEL[e] ?? e,
                value: e,
              })),
            ]}
          >
            <SelectTrigger size="sm" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All events</SelectItem>
              {eventOptions.map((e) => (
                <SelectItem key={e} value={e}>
                  {EVENT_LABEL[e] ?? e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          className="gap-1.5 rounded-md"
          onClick={handleExport}
        >
          <Upload className="size-4" />
          Export CSV
        </Button>
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
            <Label
              htmlFor="transaction-log-search"
              className="text-muted-foreground"
            >
              Search:
            </Label>
            <Input
              id="transaction-log-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="h-8 w-56"
            />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date &amp; Time</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Recorded By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((entry) => (
                <TableRow
                  key={entry.id}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        EVENT_BADGE[entry.eventType] ??
                        "bg-muted text-muted-foreground"
                      }
                    >
                      {EVENT_LABEL[entry.eventType] ?? entry.eventType}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs min-w-48 whitespace-normal break-words text-muted-foreground">
                    {entry.studentName && (
                      <span className="font-medium text-foreground">
                        {entry.studentName} ({entry.studentMatricNo}) ·{" "}
                      </span>
                    )}
                    {entry.details}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.amount != null ? formatNaira(entry.amount) : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {entry.reference ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.recordedByName}
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No transactions yet.
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
    </div>
  );
}
