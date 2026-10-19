"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, MoreHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImportExportBar } from "@/components/shared/import-export-bar";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  useDownloadLeaveRequestsTemplate,
  useExportLeaveRequests,
  useImportLeaveRequests,
  useLeaveRequests,
} from "@/hooks/use-leave";
import { formatDisplayDate } from "@/lib/attendance";
import { ReviewLeaveRequestDialog } from "./review-leave-request-dialog";
import { ReviewResumptionDialog } from "./review-resumption-dialog";
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

const PAGE_SIZE_OPTIONS = ["10", "25", "50"];

export function LeaveRequestsPanel() {
  const [status, setStatus] = useState("PENDING");
  const { data: requests = [] } = useLeaveRequests(status ? { status } : {});

  const downloadTemplate = useDownloadLeaveRequestsTemplate();
  const importRequests = useImportLeaveRequests();
  const exportRequests = useExportLeaveRequests();

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);

  const [reviewing, setReviewing] = useState<
    { request: LeaveRequest; action: "approve" | "reject" } | undefined
  >();
  const [reviewingResumption, setReviewingResumption] = useState<
    { request: LeaveRequest; action: "approve" | "reject" } | undefined
  >();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requests;
    return requests.filter(
      (request) =>
        request.staffName.toLowerCase().includes(query) ||
        request.staffCode.toLowerCase().includes(query) ||
        request.leaveTypeName.toLowerCase().includes(query),
    );
  }, [requests, search]);

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
        <ImportExportBar
          resourceLabel="Leave Requests"
          onDownloadTemplate={() => downloadTemplate.mutateAsync()}
          onImport={(file) => importRequests.mutateAsync(file)}
          onExport={() => exportRequests.mutateAsync(status || undefined)}
          templatePending={downloadTemplate.isPending}
          importPending={importRequests.isPending}
          exportPending={exportRequests.isPending}
        />
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

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value ?? "");
                setPage(1);
              }}
              items={STATUS_FILTERS}
            >
              <SelectTrigger size="sm" className="w-36">
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
            <div className="flex items-center gap-2 text-sm">
              <Label
                htmlFor="leave-requests-search"
                className="text-muted-foreground"
              >
                Filter:
              </Label>
              <Input
                id="leave-requests-search"
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
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resumed</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((request) => (
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
                    {request.status !== "APPROVED" ? (
                      "—"
                    ) : request.resumptionStatus === "APPROVED" ? (
                      "Confirmed"
                    ) : request.resumptionStatus === "PENDING" ? (
                      "Awaiting review"
                    ) : request.isAutoExtending ? (
                      <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                        <AlertTriangle className="size-3.5" />
                        Extending
                      </span>
                    ) : (
                      "Not yet"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {(request.status === "PENDING" ||
                      (request.status === "APPROVED" &&
                        request.resumptionStatus === "PENDING")) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Actions for ${request.staffName}'s request`}
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {request.status === "PENDING" ? (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  setReviewing({ request, action: "approve" })
                                }
                              >
                                <Check className="size-3.5" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() =>
                                  setReviewing({ request, action: "reject" })
                                }
                              >
                                <X className="size-3.5" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  setReviewingResumption({
                                    request,
                                    action: "approve",
                                  })
                                }
                              >
                                <Check className="size-3.5" />
                                Confirm
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() =>
                                  setReviewingResumption({
                                    request,
                                    action: "reject",
                                  })
                                }
                              >
                                <X className="size-3.5" />
                                Dispute
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
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

      <ReviewLeaveRequestDialog
        open={!!reviewing}
        onOpenChange={(open) => !open && setReviewing(undefined)}
        request={reviewing?.request}
        action={reviewing?.action}
      />
      <ReviewResumptionDialog
        open={!!reviewingResumption}
        onOpenChange={(open) => !open && setReviewingResumption(undefined)}
        request={reviewingResumption?.request}
        action={reviewingResumption?.action}
      />
    </div>
  );
}
