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
import { StudentDetailsDialog } from "@/components/features/students/student-details-dialog";
import { StudentDialog } from "@/components/features/students/student-dialog";
import { notifyInstitution } from "@/lib/notify";
import { fullName } from "@/lib/students";
import { useAcademicsStore } from "@/store/academics.store";
import { useAuthStore } from "@/store/auth.store";
import { useSchoolsStore } from "@/store/schools.store";
import { useStudentsStore } from "@/store/students.store";
import type { Student } from "@/types/student";

const PAGE_SIZE_OPTIONS = ["10", "25", "50"];

function studentsToCsv(students: Student[]) {
  const header = [
    "Matric No",
    "First Name",
    "Middle Name",
    "Last Name",
    "Gender",
    "Email",
    "Phone",
    "School",
    "Program of Study",
    "Current Level",
  ];
  const rows = students.map((s) => [
    s.matricNo,
    s.firstName,
    s.middleName ?? "",
    s.lastName,
    s.gender,
    s.email,
    s.phone,
    s.schoolId,
    s.programme,
    s.currentLevel,
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

export default function StudentManagementPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>();
  const [viewingStudent, setViewingStudent] = useState<Student | undefined>();

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Student Management"]} />

      <div>
        <h1 className="text-xl font-semibold text-primary">
          Student Management
        </h1>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground transition-transform hover:scale-[1.02] hover:bg-tertiary/10 active:scale-[0.98]"
            onClick={() => {
              setEditingStudent(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add New
          </Button>
          <ImportExportButtons />
        </div>

        <div className="mt-6">
          <StudentTable
            onEdit={(student) => {
              setEditingStudent(student);
              setDialogOpen(true);
            }}
            onView={(student) => setViewingStudent(student)}
          />
        </div>
      </div>

      <StudentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        student={editingStudent}
      />
      <StudentDetailsDialog
        open={!!viewingStudent}
        onOpenChange={(open) => !open && setViewingStudent(undefined)}
        student={viewingStudent}
      />
    </div>
  );
}

function ImportExportButtons() {
  const authUser = useAuthStore((state) => state.user);
  const students = useStudentsStore((state) => state.students);
  const createStudent = useStudentsStore((state) => state.createStudent);
  const sessions = useAcademicsStore((state) => state.sessions);
  const schools = useSchoolsStore((state) => state.schools);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const active = students.filter((s) => !s.archivedAt);
    const csv = studentsToCsv(active);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${active.length} students`);
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const rows = parseCsv(text);
    const existingMatricNos = new Set(
      students
        .filter((s) => !s.archivedAt)
        .map((s) => s.matricNo.toLowerCase()),
    );
    const defaultSchoolId = schools.find((s) => !s.archivedAt)?.id ?? "";
    const defaultSessionId =
      sessions.find((s) => s.isCurrent)?.id ??
      sessions.find((s) => !s.archivedAt)?.id ??
      "";

    let imported = 0;
    let skipped = 0;
    for (const row of rows) {
      const matricNo = row["matric no"] || row["matricno"] || "";
      const firstName = row["first name"] || "";
      const lastName = row["last name"] || "";
      if (!matricNo || !firstName || !lastName) {
        skipped++;
        continue;
      }
      if (existingMatricNos.has(matricNo.toLowerCase())) {
        skipped++;
        continue;
      }
      const gender = row["gender"] === "Female" ? "Female" : "Male";
      createStudent({
        matricNo,
        title: gender === "Female" ? "Miss" : "Mr",
        firstName,
        middleName: row["middle name"] || undefined,
        lastName,
        otherName: undefined,
        gender,
        maritalStatus: "Single",
        email:
          row["email"] ||
          `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.xyzcollege.edu.ng`,
        phone: row["phone"] || "",
        emergencyContact: row["phone"] || "",
        dateOfBirth: new Date("2005-01-01T00:00:00.000Z").toISOString(),
        religion: "Christian",
        maidenName: undefined,
        bloodGroup: "O+",
        genotype: "AA",
        weightKg: 65,
        heightCm: 170,
        nationality: "Nigeria",
        stateOfOrigin: "Lagos",
        lga: "Ikeja",
        residentAddress: "Not provided",
        avatarUrl: undefined,
        schoolId: defaultSchoolId,
        faculty: "Faculty of Physical Sciences",
        department: "Department of Computer Science",
        programme: row["program of study"] || "B.Sc. Computer Science",
        currentLevel:
          (row["current level"] as Student["currentLevel"]) || "100 Level",
        currentSessionId: defaultSessionId,
        status: "active",
        isGraduating: false,
        isDeferred: false,
        holdForReview: false,
      });
      existingMatricNos.add(matricNo.toLowerCase());
      imported++;
    }

    toast.success(
      `${imported} students imported${skipped > 0 ? `, ${skipped} skipped` : ""}`,
    );
    if (authUser?.institutionId && imported > 0) {
      notifyInstitution(
        authUser.institutionId,
        "Students imported",
        `${imported} students were imported via CSV.`,
        "/dashboard/students",
      );
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="gap-1.5 rounded-md"
        onClick={() => fileInputRef.current?.click()}
      >
        <Download className="size-4" />
        Import Users
      </Button>
      <Button
        variant="outline"
        className="gap-1.5 rounded-md"
        onClick={handleExport}
      >
        <Upload className="size-4" />
        Export Users
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

function StudentTable({
  onEdit,
  onView,
}: {
  onEdit: (student: Student) => void;
  onView: (student: Student) => void;
}) {
  const authUser = useAuthStore((state) => state.user);
  const students = useStudentsStore((state) => state.students);
  const archiveStudent = useStudentsStore((state) => state.archiveStudent);
  const restoreStudent = useStudentsStore((state) => state.restoreStudent);
  const schools = useSchoolsStore((state) => state.schools);

  const [view, setView] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);
  const [pendingArchive, setPendingArchive] = useState<Student | null>(null);
  const [pendingBulkArchive, setPendingBulkArchive] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const schoolName = (id: string) =>
    schools.find((s) => s.id === id)?.name ?? "—";

  const baseList = useMemo(
    () =>
      students.filter((student) =>
        view === "archived" ? student.archivedAt : !student.archivedAt,
      ),
    [students, view],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return baseList;
    return baseList.filter(
      (student) =>
        fullName(student).toLowerCase().includes(query) ||
        student.matricNo.toLowerCase().includes(query) ||
        student.programme.toLowerCase().includes(query),
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
  const archivedCount = students.filter((s) => s.archivedAt).length;

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
            : "← Back to active students"}
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
            <Label htmlFor="student-search" className="text-muted-foreground">
              Filter:
            </Label>
            <Input
              id="student-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Name, matric no, or programme"
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
                      aria-label="Select all students on this page"
                    />
                  </TableHead>
                )}
                <TableHead>S/N</TableHead>
                <TableHead>Matric No</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Middle Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Program of Study</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((student, index) => (
                <TableRow
                  key={student.id}
                  className="animate-in fade-in duration-300"
                >
                  {view === "active" && (
                    <TableCell>
                      <Checkbox
                        checked={selected.has(student.id)}
                        onCheckedChange={() => toggleSelect(student.id)}
                        aria-label={`Select ${fullName(student)}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground">
                    {rangeStart + index}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {student.matricNo}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                        {student.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={student.avatarUrl}
                            alt={fullName(student)}
                            className="size-full object-cover"
                          />
                        ) : (
                          <User className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-medium">{student.firstName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.middleName ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {student.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.gender}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {schoolName(student.schoolId)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.programme}
                  </TableCell>
                  <TableCell className="text-right">
                    {view === "active" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Actions for ${fullName(student)}`}
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => onView(student)}>
                            <Eye className="size-3.5" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(student)}>
                            <Pencil className="size-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setPendingArchive(student)}
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
                          restoreStudent(student.id);
                          toast.success(`${fullName(student)} restored`);
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
                      ? "No archived students."
                      : "No students match your search."}
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
        title="Delete this student?"
        description={`Are you sure you want to delete ${pendingArchive ? fullName(pendingArchive) : ""}? It will be hidden from the active list, but nothing is deleted — you can restore it anytime from "View archived".`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!pendingArchive) return;
          archiveStudent(pendingArchive.id);
          toast.success(`${fullName(pendingArchive)} deleted`);
          if (authUser?.institutionId) {
            notifyInstitution(
              authUser.institutionId,
              "Student record deleted",
              `${fullName(pendingArchive)} (${pendingArchive.matricNo}) was removed from the active list.`,
              "/dashboard/students",
            );
          }
        }}
      />

      <ConfirmDialog
        open={pendingBulkArchive}
        onOpenChange={setPendingBulkArchive}
        title={`Delete ${selected.size} students?`}
        description={`Are you sure you want to delete the ${selected.size} selected students? They will be hidden from the active list, but nothing is deleted — you can restore them anytime from "View archived".`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          selected.forEach((id) => archiveStudent(id));
          toast.success(`${selected.size} students deleted`);
          if (authUser?.institutionId) {
            notifyInstitution(
              authUser.institutionId,
              "Students deleted",
              `${selected.size} student records were removed from the active list.`,
              "/dashboard/students",
            );
          }
          setSelected(new Set());
        }}
      />
    </>
  );
}
