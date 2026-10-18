"use client";

import { useMemo, useState } from "react";
import {
  ArchiveRestore,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  useArchiveLeaveType,
  useLeaveTypes,
  useRestoreLeaveType,
} from "@/hooks/use-leave";
import { LeaveTypeDialog } from "./leave-type-dialog";
import type { LeaveType } from "@/types/leave";

const PAGE_SIZE_OPTIONS = ["10", "25", "50"];

export function LeaveTypesPanel() {
  const { data: types = [] } = useLeaveTypes();
  const archiveType = useArchiveLeaveType();
  const restoreType = useRestoreLeaveType();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveType | undefined>();
  const [pendingArchive, setPendingArchive] = useState<LeaveType | null>(null);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);

  const active = useMemo(() => types.filter((t) => !t.archivedAt), [types]);
  const archived = types.filter((t) => t.archivedAt);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return active;
    return active.filter((type) => type.name.toLowerCase().includes(query));
  }, [active, search]);

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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Leave Types</h3>
          <p className="text-xs text-muted-foreground">
            Define each leave policy — how many days per year, and whether
            unused days roll over.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add Leave Type
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
              htmlFor="leave-types-search"
              className="text-muted-foreground"
            >
              Filter:
            </Label>
            <Input
              id="leave-types-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Leave type name"
              className="h-8 w-56"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Days / Year</TableHead>
                <TableHead>Rollover</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((type) => (
                <TableRow
                  key={type.id}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {type.defaultDaysPerYear}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {type.rollover
                      ? `Yes${type.maxRolloverDays != null ? ` (max ${type.maxRolloverDays})` : " (no cap)"}`
                      : "No"}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-500/10 text-emerald-600">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Actions for ${type.name}`}
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(type);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setPendingArchive(type)}
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {active.length === 0
                      ? "No leave types yet."
                      : "No leave types match this filter."}
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

          {archived.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Archived
              </p>
              <div className="space-y-2">
                {archived.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">{type.name}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await restoreType.mutateAsync(type.id);
                          toast.success(`${type.name} restored`);
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "Failed to restore leave type",
                          );
                        }
                      }}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-secondary transition-colors hover:bg-secondary/10"
                    >
                      <ArchiveRestore className="size-3.5" />
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <LeaveTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        leaveType={editing}
      />

      <ConfirmDialog
        open={!!pendingArchive}
        onOpenChange={(open) => !open && setPendingArchive(null)}
        title="Delete this leave type?"
        description={`Are you sure you want to delete "${pendingArchive?.name}"? Existing requests against it are kept; staff just won't be able to request it anymore. You can restore it anytime.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!pendingArchive) return;
          try {
            await archiveType.mutateAsync(pendingArchive.id);
            toast.success(`${pendingArchive.name} deleted`);
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to delete leave type",
            );
          }
        }}
      />
    </div>
  );
}
