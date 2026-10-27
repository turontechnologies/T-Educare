"use client";

import { useMemo, useState } from "react";
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
import { AssignRoomDialog } from "./assign-room-dialog";
import { useHostelAllocations } from "@/hooks/use-hostels";
import type { HostelAllocation } from "@/types/hostel";

const PAGE_SIZE_OPTIONS = ["5", "10", "25", "50"];

export function HostelWaitlistPanel() {
  const { data: allAllocations = [] } = useHostelAllocations("WAITLIST");

  const [moveFor, setMoveFor] = useState<HostelAllocation | undefined>();
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("5");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allAllocations;
    return allAllocations.filter(
      (a) =>
        a.studentMatricNo.toLowerCase().includes(query) ||
        a.studentName.toLowerCase().includes(query),
    );
  }, [allAllocations, search]);

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
            <Label htmlFor="waitlist-search" className="text-muted-foreground">
              Search:
            </Label>
            <Input
              id="waitlist-search"
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
                  <TableCell className="text-muted-foreground">–</TableCell>
                  <TableCell className="text-muted-foreground">–</TableCell>
                  <TableCell>
                    <Badge className="bg-secondary/10 text-secondary">
                      Waitlist
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() => setMoveFor(allocation)}
                      className="cursor-pointer text-sm font-medium text-secondary hover:underline"
                    >
                      Move to allocations
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No students on the waitlist.
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

      <AssignRoomDialog
        allocation={moveFor}
        mode="propose"
        title="Move to Allocations"
        onOpenChange={(open) => !open && setMoveFor(undefined)}
      />
    </div>
  );
}
