"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArchiveRestore,
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { StaffDetailsDialog } from "@/components/features/staff/staff-details-dialog";
import { StaffMemberDialog } from "@/components/features/staff/staff-member-dialog";
import {
  useArchiveStaffMember,
  useExportStaffMembers,
  useImportStaffMembers,
  useRestoreStaffMember,
} from "@/hooks/use-staff-members";
import { STAFF_DISCIPLINARY_STATUS_BADGE, fullName } from "@/lib/staff-members";
import { useDepartmentsStore } from "@/store/departments.store";
import { useStaffStore } from "@/store/staff.store";
import { useStaffMembersStore } from "@/store/staff-members.store";
import type { StaffMember } from "@/types/staff-member";

const PAGE_SIZE_OPTIONS = ["10", "25", "50"];

export default function AllStaffPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | undefined>();
  const [detailsStaff, setDetailsStaff] = useState<StaffMember | undefined>();
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Staff Management"]} />

      <div>
        <h1 className="text-xl font-semibold text-primary">All Staff</h1>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground transition-transform hover:scale-[1.02] hover:bg-tertiary/10 active:scale-[0.98]"
            onClick={() => {
              setEditingStaff(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add New
          </Button>
          <ImportExportButtons />
        </div>

        <div className="mt-6">
          <StaffTable
            onEdit={(staff) => {
              setEditingStaff(staff);
              setDialogOpen(true);
            }}
            onView={(staff) => {
              setDetailsStaff(staff);
              setDetailsOpen(true);
            }}
          />
        </div>
      </div>

      <StaffMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staffMember={editingStaff}
      />
      <StaffDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        staffMember={detailsStaff}
      />
    </div>
  );
}

function ImportExportButtons() {
  const importStaff = useImportStaffMembers();
  const exportStaff = useExportStaffMembers();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const blob = await exportStaff.mutateAsync(false);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `staff-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Staff exported");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to export staff",
      );
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const result = await importStaff.mutateAsync(file);
      toast.success(
        `${result.imported} staff imported${result.skipped > 0 ? `, ${result.skipped} skipped` : ""}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to import staff",
      );
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="gap-1.5 rounded-md"
        disabled={importStaff.isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        <Download className="size-4" />
        Import Staff
      </Button>
      <Button
        variant="outline"
        className="gap-1.5 rounded-md"
        disabled={exportStaff.isPending}
        onClick={handleExport}
      >
        <Upload className="size-4" />
        Export Staff
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleImportFile(file);
          event.target.value = "";
        }}
        className="sr-only"
      />
    </>
  );
}

function StaffTable({
  onEdit,
  onView,
}: {
  onEdit: (staff: StaffMember) => void;
  onView: (staff: StaffMember) => void;
}) {
  const staffMembers = useStaffMembersStore((state) => state.staffMembers);
  const archiveStaffMember = useArchiveStaffMember();
  const restoreStaffMember = useRestoreStaffMember();
  const departments = useDepartmentsStore((state) => state.departments);
  const designations = useStaffStore((state) => state.designations);

  const [view, setView] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);
  const [pendingArchive, setPendingArchive] = useState<StaffMember | null>(
    null,
  );
  const [pendingBulkArchive, setPendingBulkArchive] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const departmentName = (id: string) =>
    departments.find((d) => d.id === id)?.name ?? "—";
  const designationName = (id: string) =>
    designations.find((d) => d.id === id)?.name ?? "—";

  const baseList = useMemo(
    () =>
      staffMembers.filter((staff) =>
        view === "archived" ? staff.archivedAt : !staff.archivedAt,
      ),
    [staffMembers, view],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return baseList;
    return baseList.filter(
      (staff) =>
        fullName(staff).toLowerCase().includes(query) ||
        staff.staffId.toLowerCase().includes(query) ||
        designationName(staff.designationId).toLowerCase().includes(query),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseList, search, designations]);

  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * size,
    currentPage * size,
  );
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * size + 1;
  const rangeEnd = Math.min(currentPage * size, filtered.length);
  const archivedCount = staffMembers.filter((s) => s.archivedAt).length;

  const allOnPageSelected =
    paginated.length > 0 && paginated.every((s) => selected.has(s.id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        paginated.forEach((s) => next.delete(s.id));
      } else {
        paginated.forEach((s) => next.add(s.id));
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setView((v) => (v === "active" ? "archived" : "active"));
            setPage(1);
            setSearch("");
            setSelected(new Set());
          }}
          className="cursor-pointer text-sm font-medium text-secondary hover:underline"
        >
          {view === "active"
            ? `View archived (${archivedCount})`
            : "← Back to active staff"}
        </button>
      </div>

      {view === "active" && selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-secondary/30 bg-secondary/5 px-4 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-sm font-medium text-foreground">
            {selected.size} selected
          </span>
          <button
            type="button"
            onClick={() => setPendingBulkArchive(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
            Delete Selected
          </button>
        </div>
      )}

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
            <Label htmlFor="staff-search" className="text-muted-foreground">
              Filter:
            </Label>
            <Input
              id="staff-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Name, staff ID, or designation"
              className="h-8 w-56"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {view === "active" && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allOnPageSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all staff on this page"
                    />
                  </TableHead>
                )}
                <TableHead>S/N</TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Middle Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((staff, index) => (
                <TableRow
                  key={staff.id}
                  className="animate-in fade-in duration-300"
                >
                  {view === "active" && (
                    <TableCell>
                      <Checkbox
                        checked={selected.has(staff.id)}
                        onCheckedChange={() => toggleSelect(staff.id)}
                        aria-label={`Select ${fullName(staff)}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground">
                    {rangeStart + index}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {staff.staffId}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                        {staff.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={staff.avatarUrl}
                            alt={fullName(staff)}
                            className="size-full object-cover"
                          />
                        ) : (
                          <User className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-medium">{staff.firstName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {staff.middleName ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {staff.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {staff.gender}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {designationName(staff.designationId)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {departmentName(staff.departmentId)}
                  </TableCell>
                  <TableCell>
                    {staff.disciplinaryStatus !== "NONE" ? (
                      <Badge
                        className={
                          STAFF_DISCIPLINARY_STATUS_BADGE[
                            staff.disciplinaryStatus
                          ].className
                        }
                      >
                        {
                          STAFF_DISCIPLINARY_STATUS_BADGE[
                            staff.disciplinaryStatus
                          ].label
                        }
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-600">
                        Good Standing
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {view === "active" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Actions for ${fullName(staff)}`}
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => onView(staff)}>
                            <Eye className="size-3.5" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(staff)}>
                            <Pencil className="size-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setPendingArchive(staff)}
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await restoreStaffMember.mutateAsync(staff.id);
                            toast.success(`${fullName(staff)} restored`);
                          } catch (error) {
                            toast.error(
                              error instanceof Error
                                ? error.message
                                : "Failed to restore staff member",
                            );
                          }
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-secondary transition-colors hover:bg-secondary/10"
                      >
                        <ArchiveRestore className="size-3.5" />
                        Restore
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={view === "active" ? 11 : 10}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {view === "archived"
                      ? "No archived staff."
                      : "No staff match your search."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>
              Showing {rangeStart} to {rangeEnd} of {filtered.length} entries
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Button
                  key={n}
                  variant={n === currentPage ? "default" : "outline"}
                  size="sm"
                  className="size-7 p-0"
                  onClick={() => setPage(n)}
                >
                  {n}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!pendingArchive}
        onOpenChange={(open) => !open && setPendingArchive(null)}
        title="Delete this staff member?"
        description={`Are you sure you want to delete ${pendingArchive ? fullName(pendingArchive) : ""}? It will be hidden from the active list, but nothing is deleted — you can restore it anytime from "View archived".`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!pendingArchive) return;
          try {
            await archiveStaffMember.mutateAsync(pendingArchive.id);
            toast.success(`${fullName(pendingArchive)} deleted`);
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to delete staff member",
            );
          }
        }}
      />

      <ConfirmDialog
        open={pendingBulkArchive}
        onOpenChange={setPendingBulkArchive}
        title={`Delete ${selected.size} staff?`}
        description={`Are you sure you want to delete the ${selected.size} selected staff? They will be hidden from the active list, but nothing is deleted — you can restore them anytime from "View archived".`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          const ids = Array.from(selected);
          try {
            await Promise.all(
              ids.map((id) => archiveStaffMember.mutateAsync(id)),
            );
            toast.success(`${ids.length} staff deleted`);
            setSelected(new Set());
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to delete selected staff",
            );
          }
        }}
      />
    </>
  );
}
