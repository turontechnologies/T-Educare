"use client";

import { useMemo, useState } from "react";
import { addDays, format, subDays } from "date-fns";
import {
  CalendarCheck,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Clock,
  History,
  Plus,
  UserX,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAttendanceOverview,
  useDownloadAttendanceTemplate,
  useExportAttendance,
  useImportAttendance,
} from "@/hooks/use-attendance";
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  formatClockTime,
  formatDisplayDate,
  todayIsoDate,
} from "@/lib/attendance";
import { ImportExportBar } from "@/components/shared/import-export-bar";
import { TablePagination } from "@/components/shared/table-pagination";
import { useDepartmentsStore } from "@/store/departments.store";
import { AttendanceTrendChart } from "./attendance-trend-chart";
import { ManualEntryDialog } from "./manual-entry-dialog";
import { StaffHistoryDialog } from "./staff-history-dialog";

const PAGE_SIZE_OPTIONS = ["10", "25", "50", "100"];

const STAT_CARDS = [
  {
    key: "presentCount" as const,
    label: "Present",
    icon: CalendarCheck,
    tint: "bg-emerald-500/10 text-emerald-600",
  },
  {
    key: "lateCount" as const,
    label: "Late",
    icon: Clock,
    tint: "bg-amber-500/10 text-amber-600",
  },
  {
    key: "onLeaveCount" as const,
    label: "On Leave",
    icon: CalendarOff,
    tint: "bg-tertiary/15 text-tertiary-foreground",
  },
  {
    key: "absentCount" as const,
    label: "Absent",
    icon: UserX,
    tint: "bg-destructive/10 text-destructive",
  },
  {
    key: "notClockedInCount" as const,
    label: "Not Clocked In",
    icon: Clock,
    tint: "bg-muted text-muted-foreground",
  },
];

export function AttendanceOverviewPanel() {
  const [date, setDate] = useState(todayIsoDate());
  const [departmentId, setDepartmentId] = useState("");
  const { data: overview } = useAttendanceOverview(
    date,
    departmentId || undefined,
  );
  const departments = useDepartmentsStore((state) => state.departments);
  const activeDepartments = useMemo(
    () => departments.filter((d) => !d.archivedAt),
    [departments],
  );

  const downloadTemplate = useDownloadAttendanceTemplate();
  const importAttendance = useImportAttendance();
  const exportAttendance = useExportAttendance();

  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [historyFor, setHistoryFor] = useState<
    { staffId: string; staffName: string } | undefined
  >();

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("25");
  const [page, setPage] = useState(1);

  const isToday = date === todayIsoDate();

  const entries = useMemo(() => overview?.entries ?? [], [overview]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter(
      (entry) =>
        entry.staffName.toLowerCase().includes(query) ||
        entry.staffCode.toLowerCase().includes(query),
    );
  }, [entries, search]);

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-md"
            onClick={() =>
              setDate(
                format(subDays(new Date(`${date}T00:00:00`), 1), "yyyy-MM-dd"),
              )
            }
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="min-w-48 text-center">
            <p className="text-sm font-medium text-foreground">
              {formatDisplayDate(date)}
            </p>
            {!isToday && (
              <button
                type="button"
                onClick={() => setDate(todayIsoDate())}
                className="cursor-pointer text-xs font-medium text-secondary hover:underline"
              >
                Back to today
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-md"
            disabled={isToday}
            onClick={() =>
              setDate(
                format(addDays(new Date(`${date}T00:00:00`), 1), "yyyy-MM-dd"),
              )
            }
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Label htmlFor="attendance-department-filter">Department:</Label>
          <Select
            value={departmentId}
            onValueChange={(value) => setDepartmentId(value ?? "")}
          >
            <SelectTrigger
              id="attendance-department-filter"
              size="sm"
              className="w-48"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Departments</SelectItem>
              {activeDepartments.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <ImportExportBar
            resourceLabel="Attendance"
            onDownloadTemplate={() => downloadTemplate.mutateAsync()}
            onImport={(file) => importAttendance.mutateAsync(file)}
            onExport={() =>
              exportAttendance.mutateAsync({
                from: format(subDays(new Date(), 29), "yyyy-MM-dd"),
                to: todayIsoDate(),
              })
            }
            templatePending={downloadTemplate.isPending}
            importPending={importAttendance.isPending}
            exportPending={exportAttendance.isPending}
          />
          <Button
            variant="outline"
            className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground"
            onClick={() => setManualEntryOpen(true)}
          >
            <Plus className="size-4" />
            Record Manual Entry
          </Button>
        </div>
      </div>

      {overview && !overview.workday && (
        <Card className="border-secondary/30 bg-secondary/5">
          <CardContent className="p-4 text-sm text-secondary">
            This is not a configured workday — attendance isn&apos;t tracked
            against it.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {STAT_CARDS.map(({ key, label, icon: Icon, tint }) => (
          <Card
            key={key}
            className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500"
          >
            <CardContent className="flex items-center gap-3 p-4">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full ${tint}`}
              >
                <Icon className="size-4" />
              </span>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {overview?.[key] ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AttendanceTrendChart
        departmentId={departmentId || undefined}
        onBarClick={setDate}
      />

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
              htmlFor="attendance-overview-search"
              className="text-muted-foreground"
            >
              Filter:
            </Label>
            <Input
              id="attendance-overview-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Staff name or code"
              className="h-8 w-56"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((entry) => (
                <TableRow
                  key={entry.staffId}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {entry.staffCode}
                  </TableCell>
                  <TableCell className="font-medium">
                    {entry.staffName}
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
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setHistoryFor({
                          staffId: entry.staffCode,
                          staffName: entry.staffName,
                        })
                      }
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-secondary transition-colors hover:bg-secondary/10"
                    >
                      <History className="size-3.5" />
                      History
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {entries.length === 0
                      ? "No staff members yet."
                      : "No staff match this filter."}
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

      <ManualEntryDialog
        open={manualEntryOpen}
        onOpenChange={setManualEntryOpen}
      />
      <StaffHistoryDialog
        open={!!historyFor}
        onOpenChange={(open) => !open && setHistoryFor(undefined)}
        staffId={historyFor?.staffId}
        staffName={historyFor?.staffName}
      />
    </div>
  );
}
