"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArchiveRestore,
  Download,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";
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
import { StaffMemberDialog } from "@/components/features/staff/staff-member-dialog";
import { fullName } from "@/lib/staff-members";
import { useDepartmentsStore } from "@/store/departments.store";
import { useStaffStore } from "@/store/staff.store";
import { useStaffMembersStore } from "@/store/staff-members.store";
import type { StaffMember } from "@/types/staff-member";

const PAGE_SIZE_OPTIONS = ["10", "25", "50"];

function staffToCsv(staffMembers: StaffMember[]) {
  const header = [
    "Staff ID",
    "First Name",
    "Middle Name",
    "Last Name",
    "Gender",
    "Designation",
    "Department",
  ];
  const rows = staffMembers.map((s) => [
    s.staffId,
    s.firstName,
    s.middleName ?? "",
    s.lastName,
    s.gender,
    s.designation,
    s.departmentId,
  ]);
  return [header, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const record: Record<string, string> = {};
    header.forEach((key, i) => (record[key] = cells[i] ?? ""));
    return record;
  });
}

export default function AllStaffPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | undefined>();

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
          />
        </div>
      </div>

      <StaffMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staffMember={editingStaff}
      />
    </div>
  );
}

function ImportExportButtons() {
  const staffMembers = useStaffMembersStore((state) => state.staffMembers);
  const createStaffMember = useStaffMembersStore(
    (state) => state.createStaffMember,
  );
  const designations = useStaffStore((state) => state.designations);
  const departments = useDepartmentsStore((state) => state.departments);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const active = staffMembers.filter((s) => !s.archivedAt);
    const csv = staffToCsv(active);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `staff-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${active.length} staff`);
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const rows = parseCsv(text);
    const existingStaffIds = new Set(
      staffMembers
        .filter((s) => !s.archivedAt)
        .map((s) => s.staffId.toLowerCase()),
    );
    const defaultDesignation =
      designations.find((d) => !d.archivedAt)?.name ?? "";
    const defaultDepartmentId =
      departments.find((d) => !d.archivedAt)?.id ?? "";

    let imported = 0;
    let skipped = 0;
    for (const row of rows) {
      const staffId = row["staff id"] || "";
      const firstName = row["first name"] || "";
      const lastName = row["last name"] || "";
      if (!staffId || !firstName || !lastName) {
        skipped++;
        continue;
      }
      if (existingStaffIds.has(staffId.toLowerCase())) {
        skipped++;
        continue;
      }
      const gender = row["gender"] === "Female" ? "Female" : "Male";
      createStaffMember({
        staffId,
        role: row["designation"] || defaultDesignation,
        designation: row["designation"] || defaultDesignation,
        departmentId: defaultDepartmentId,
        gender,
        firstName,
        middleName: row["middle name"] || undefined,
        lastName,
        maritalStatus: "Single",
        email:
          row["email"] ||
          `${firstName.toLowerCase()}.${lastName.toLowerCase()}@staff.xyzcollege.edu.ng`,
        phone: row["phone"] || "",
        emergencyContact: row["phone"] || "",
        dateOfBirth: new Date("1990-01-01T00:00:00.000Z").toISOString(),
        employmentStartDate: new Date().toISOString(),
        contactAddress: "Not provided",
      });
      existingStaffIds.add(staffId.toLowerCase());
      imported++;
    }

    toast.success(
      `${imported} staff imported${skipped > 0 ? `, ${skipped} skipped` : ""}`,
    );
  };

  return (
    <>
      <Button
        variant="outline"
        className="gap-1.5 rounded-md"
        onClick={() => fileInputRef.current?.click()}
      >
        <Download className="size-4" />
        Import Staff
      </Button>
      <Button
        variant="outline"
        className="gap-1.5 rounded-md"
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

function StaffTable({ onEdit }: { onEdit: (staff: StaffMember) => void }) {
  const staffMembers = useStaffMembersStore((state) => state.staffMembers);
  const archiveStaffMember = useStaffMembersStore(
    (state) => state.archiveStaffMember,
  );
  const restoreStaffMember = useStaffMembersStore(
    (state) => state.restoreStaffMember,
  );
  const departments = useDepartmentsStore((state) => state.departments);

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
        staff.designation.toLowerCase().includes(query),
    );
  }, [baseList, search]);

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
                    {staff.designation}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {departmentName(staff.departmentId)}
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
                        onClick={() => {
                          restoreStaffMember(staff.id);
                          toast.success(`${fullName(staff)} restored`);
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
                    colSpan={view === "active" ? 10 : 9}
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
        onConfirm={() => {
          if (!pendingArchive) return;
          archiveStaffMember(pendingArchive.id);
          toast.success(`${fullName(pendingArchive)} deleted`);
        }}
      />

      <ConfirmDialog
        open={pendingBulkArchive}
        onOpenChange={setPendingBulkArchive}
        title={`Delete ${selected.size} staff?`}
        description={`Are you sure you want to delete the ${selected.size} selected staff? They will be hidden from the active list, but nothing is deleted — you can restore them anytime from "View archived".`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          selected.forEach((id) => archiveStaffMember(id));
          toast.success(`${selected.size} staff deleted`);
          setSelected(new Set());
        }}
      />
    </>
  );
}
