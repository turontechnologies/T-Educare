"use client";

import { useMemo, useState } from "react";
import {
  ArchiveRestore,
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { fullName } from "@/lib/students";
import { useArchiveStudent, useRestoreStudent } from "@/hooks/use-students";
import { useProgramLevelsStore } from "@/store/program-levels.store";
import { useProgramsStore } from "@/store/programs.store";
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
  ];
  const rows = students.map((s) => [
    s.matricNo ?? "(pre-student)",
    s.firstName,
    s.middleName ?? "",
    s.lastName,
    s.gender,
    s.email,
    s.phone,
  ]);
  return [header, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
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
          <ExportButton />
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

function ExportButton() {
  const students = useStudentsStore((state) => state.students);

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

  return (
    <Button
      variant="outline"
      className="gap-1.5 rounded-md"
      onClick={handleExport}
    >
      <Download className="size-4" />
      Export Students
    </Button>
  );
}

function StudentTable({
  onEdit,
  onView,
}: {
  onEdit: (student: Student) => void;
  onView: (student: Student) => void;
}) {
  const students = useStudentsStore((state) => state.students);
  const archiveStudent = useArchiveStudent();
  const restoreStudent = useRestoreStudent();
  const schools = useSchoolsStore((state) => state.schools);
  const programs = useProgramsStore((state) => state.programs);
  const programLevels = useProgramLevelsStore((state) => state.programLevels);

  const [cohort, setCohort] = useState<"students" | "pre-students">("students");
  const [view, setView] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);
  const [pendingArchive, setPendingArchive] = useState<Student | null>(null);

  const schoolName = (id: string) =>
    schools.find((s) => s.id === id)?.name ?? "—";
  const programName = (id: string) =>
    programs.find((p) => p.id === id)?.name ?? "—";
  const levelName = (id: string) =>
    programLevels.find((l) => l.id === id)?.levelCode ?? "—";

  const cohortList = useMemo(
    () =>
      students.filter((s) =>
        cohort === "pre-students" ? !s.matricNo : !!s.matricNo,
      ),
    [students, cohort],
  );

  const baseList = useMemo(
    () =>
      cohortList.filter((student) =>
        view === "archived" ? student.archivedAt : !student.archivedAt,
      ),
    [cohortList, view],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return baseList;
    return baseList.filter(
      (student) =>
        fullName(student).toLowerCase().includes(query) ||
        (student.matricNo ?? "").toLowerCase().includes(query) ||
        programName(student.programId).toLowerCase().includes(query),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseList, search, programs]);

  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * size,
    currentPage * size,
  );
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * size + 1;
  const rangeEnd = Math.min(currentPage * size, filtered.length);
  const archivedCount = cohortList.filter((s) => s.archivedAt).length;
  const preStudentCount = students.filter(
    (s) => !s.matricNo && !s.archivedAt,
  ).length;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-md border border-border p-0.5">
          <button
            type="button"
            onClick={() => {
              setCohort("students");
              setPage(1);
              setSearch("");
            }}
            className={`cursor-pointer rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
              cohort === "students"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Students
          </button>
          <button
            type="button"
            onClick={() => {
              setCohort("pre-students");
              setPage(1);
              setSearch("");
            }}
            className={`cursor-pointer rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
              cohort === "pre-students"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Pre-Students{preStudentCount > 0 ? ` (${preStudentCount})` : ""}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setView((v) => (v === "active" ? "archived" : "active"));
            setPage(1);
            setSearch("");
          }}
          className="cursor-pointer text-sm font-medium text-secondary hover:underline"
        >
          {view === "active"
            ? `View archived (${archivedCount})`
            : "← Back to active"}
        </button>
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
              placeholder="Name, matric no, or program"
              className="h-8 w-56"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S/N</TableHead>
                <TableHead>Matric No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((student, index) => (
                <TableRow
                  key={student.id}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="text-muted-foreground">
                    {rangeStart + index}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {student.matricNo ?? "—"}
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
                      <span className="font-medium">{fullName(student)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.gender}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {schoolName(student.schoolId)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {programName(student.programId)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {levelName(student.programLevelId)}
                  </TableCell>
                  <TableCell>
                    {student.disciplinaryStatus !== "NONE" ? (
                      <Badge
                        className={
                          student.disciplinaryStatus === "SUSPENDED"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-destructive/10 text-destructive"
                        }
                      >
                        {student.disciplinaryStatus === "SUSPENDED"
                          ? "Suspended"
                          : "Expelled"}
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
                        onClick={async () => {
                          try {
                            await restoreStudent.mutateAsync(student.id);
                            toast.success(`${fullName(student)} restored`);
                          } catch (error) {
                            toast.error(
                              error instanceof Error
                                ? error.message
                                : "Failed to restore student",
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
                    colSpan={9}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {view === "archived"
                      ? "No archived records."
                      : cohort === "pre-students"
                        ? "No pre-students yet."
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
        onConfirm={async () => {
          if (!pendingArchive) return;
          try {
            await archiveStudent.mutateAsync(pendingArchive.id);
            toast.success(`${fullName(pendingArchive)} deleted`);
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to delete student",
            );
          }
        }}
      />
    </>
  );
}
