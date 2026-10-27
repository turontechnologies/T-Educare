"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { AddStudentDialog } from "./add-student-dialog";
import { AssignRoomDialog } from "./assign-room-dialog";
import {
  useHostelAllocations,
  useMoveAllocationToWaitlist,
  useRemoveAllocation,
} from "@/hooks/use-hostels";
import type { HostelAllocation } from "@/types/hostel";

const PAGE_SIZE_OPTIONS = ["5", "10", "25", "50"];

const STATUS_BADGE: Record<string, string> = {
  PENDING_ALLOCATION: "bg-amber-500/10 text-amber-600",
  ALLOCATED: "bg-emerald-500/10 text-emerald-600",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_ALLOCATION: "Pending Allocation",
  ALLOCATED: "Allocated",
};

export function HostelAllocationsPanel() {
  const { data: allAllocations = [] } = useHostelAllocations();
  const allocations = useMemo(
    () => allAllocations.filter((a) => a.status !== "WAITLIST"),
    [allAllocations],
  );
  const moveToWaitlist = useMoveAllocationToWaitlist();
  const removeAllocation = useRemoveAllocation();

  const [addOpen, setAddOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<HostelAllocation | undefined>();
  const [removeFor, setRemoveFor] = useState<HostelAllocation | undefined>();

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("5");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allocations;
    return allocations.filter(
      (a) =>
        a.studentMatricNo.toLowerCase().includes(query) ||
        a.studentName.toLowerCase().includes(query),
    );
  }, [allocations, search]);

  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * size,
    currentPage * size,
  );
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * size + 1;
  const rangeEnd = Math.min(currentPage * size, filtered.length);

  const handleMoveToWaitlist = async (allocation: HostelAllocation) => {
    try {
      await moveToWaitlist.mutateAsync(allocation.id);
      toast.success(`${allocation.studentName} moved to waitlist`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to move to waitlist",
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-1.5 rounded-md" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          Add Student
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
              htmlFor="allocations-search"
              className="text-muted-foreground"
            >
              Search:
            </Label>
            <Input
              id="allocations-search"
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
                <TableHead>Hostel Name</TableHead>
                <TableHead>Room Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((allocation) => (
                <TableRow
                  key={allocation.id}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {allocation.studentMatricNo}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {allocation.studentName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {allocation.departmentName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {allocation.hostelName ?? "–"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {allocation.roomNumber ?? "–"}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_BADGE[allocation.status]}>
                      {STATUS_LABEL[allocation.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Actions for ${allocation.studentName}`}
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() => setAssignFor(allocation)}
                        >
                          {allocation.status === "ALLOCATED"
                            ? "Change room"
                            : "Allocate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleMoveToWaitlist(allocation)}
                        >
                          Move to waitlist
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setRemoveFor(allocation)}
                        >
                          {allocation.status === "ALLOCATED"
                            ? "Remove from hostel"
                            : "Reject"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No students in the allocation queue yet.
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

      <AddStudentDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        existingAllocations={allAllocations}
      />

      <AssignRoomDialog
        allocation={assignFor}
        mode="confirm"
        title={
          assignFor?.status === "ALLOCATED" ? "Change Room" : "Allocate Room"
        }
        onOpenChange={(open) => !open && setAssignFor(undefined)}
      />

      <ConfirmDialog
        open={!!removeFor}
        onOpenChange={(open) => !open && setRemoveFor(undefined)}
        title={
          removeFor?.status === "ALLOCATED"
            ? "Remove from hostel?"
            : "Reject this allocation?"
        }
        description={`Are you sure you want to ${
          removeFor?.status === "ALLOCATED" ? "remove" : "reject"
        } ${removeFor?.studentName}${removeFor?.status === "ALLOCATED" ? ` from ${removeFor?.hostelName}` : ""}? This can't be undone.`}
        confirmLabel={removeFor?.status === "ALLOCATED" ? "Remove" : "Reject"}
        variant="destructive"
        onConfirm={async () => {
          if (!removeFor) return;
          try {
            await removeAllocation.mutateAsync(removeFor.id);
            toast.success(
              removeFor.status === "ALLOCATED"
                ? "Removed from hostel"
                : "Allocation rejected",
            );
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to remove allocation",
            );
          }
        }}
      />
    </div>
  );
}
