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
} from "lucide-react";
import { toast } from "sonner";
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
import { CourseDialog } from "@/components/features/academics/course-dialog";
import { notifyInstitution } from "@/lib/notify";
import { useAuthStore } from "@/store/auth.store";
import { useCoursesStore } from "@/store/courses.store";
import { useDepartmentsStore } from "@/store/departments.store";
import { useSchoolsStore } from "@/store/schools.store";
import type { Course } from "@/types/course";

const PAGE_SIZE_OPTIONS = ["10", "25", "50"];

function coursesToCsv(courses: Course[]) {
  const header = ["Course Name", "Course Code", "Department", "School"];
  const rows = courses.map((c) => [c.name, c.code, c.departmentId, c.schoolId]);
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

export default function CoursesManagementPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | undefined>();

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Courses Management"]} />

      <div>
        <h1 className="text-xl font-semibold text-primary">
          Courses Management
        </h1>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground transition-transform hover:scale-[1.02] hover:bg-tertiary/10 active:scale-[0.98]"
            onClick={() => {
              setEditingCourse(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add New
          </Button>
          <ImportExportButtons />
        </div>

        <div className="mt-6">
          <CourseTable
            onEdit={(course) => {
              setEditingCourse(course);
              setDialogOpen(true);
            }}
          />
        </div>
      </div>

      <CourseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        course={editingCourse}
      />
    </div>
  );
}

function ImportExportButtons() {
  const authUser = useAuthStore((state) => state.user);
  const courses = useCoursesStore((state) => state.courses);
  const createCourse = useCoursesStore((state) => state.createCourse);
  const departments = useDepartmentsStore((state) => state.departments);
  const schools = useSchoolsStore((state) => state.schools);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const active = courses.filter((c) => !c.archivedAt);
    const csv = coursesToCsv(active);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `courses-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${active.length} courses`);
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const rows = parseCsv(text);
    const existingCodes = new Set(
      courses.filter((c) => !c.archivedAt).map((c) => c.code.toLowerCase()),
    );
    const defaultDepartmentId =
      departments.find((d) => !d.archivedAt)?.id ?? "";
    const defaultSchoolId = schools.find((s) => !s.archivedAt)?.id ?? "";

    let imported = 0;
    let skipped = 0;
    for (const row of rows) {
      const name = row["course name"] || "";
      const code = row["course code"] || "";
      if (!name || !code || existingCodes.has(code.toLowerCase())) {
        skipped++;
        continue;
      }
      createCourse({
        name,
        code,
        departmentId: defaultDepartmentId,
        schoolId: defaultSchoolId,
      });
      existingCodes.add(code.toLowerCase());
      imported++;
    }

    toast.success(
      `${imported} courses imported${skipped > 0 ? `, ${skipped} skipped` : ""}`,
    );
    if (authUser?.institutionId && imported > 0) {
      notifyInstitution(
        authUser.institutionId,
        "Courses imported",
        `${imported} courses were imported via CSV.`,
        "/dashboard/academics/courses",
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

function CourseTable({ onEdit }: { onEdit: (course: Course) => void }) {
  const authUser = useAuthStore((state) => state.user);
  const courses = useCoursesStore((state) => state.courses);
  const archiveCourse = useCoursesStore((state) => state.archiveCourse);
  const restoreCourse = useCoursesStore((state) => state.restoreCourse);
  const departments = useDepartmentsStore((state) => state.departments);
  const schools = useSchoolsStore((state) => state.schools);

  const [view, setView] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);
  const [pendingArchive, setPendingArchive] = useState<Course | null>(null);

  const departmentName = (id: string) =>
    departments.find((d) => d.id === id)?.name ?? "—";
  const schoolName = (id: string) =>
    schools.find((s) => s.id === id)?.name ?? "—";

  const baseList = useMemo(
    () =>
      courses.filter((course) =>
        view === "archived" ? course.archivedAt : !course.archivedAt,
      ),
    [courses, view],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return baseList;
    return baseList.filter(
      (course) =>
        course.name.toLowerCase().includes(query) ||
        course.code.toLowerCase().includes(query) ||
        departmentName(course.departmentId).toLowerCase().includes(query) ||
        schoolName(course.schoolId).toLowerCase().includes(query),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseList, search, departments, schools]);

  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * size,
    currentPage * size,
  );
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * size + 1;
  const rangeEnd = Math.min(currentPage * size, filtered.length);
  const archivedCount = courses.filter((c) => c.archivedAt).length;

  return (
    <>
      <div className="mb-3 flex justify-end">
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
            : "← Back to active courses"}
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
            <Label htmlFor="course-search" className="text-muted-foreground">
              Filter:
            </Label>
            <Input
              id="course-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="h-8 w-48"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S/N</TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead>Course Code</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>School</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((course, index) => (
                <TableRow
                  key={course.id}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="text-muted-foreground">
                    {rangeStart + index}
                  </TableCell>
                  <TableCell className="font-medium">{course.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {course.code}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {departmentName(course.departmentId)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {schoolName(course.schoolId)}
                  </TableCell>
                  <TableCell className="text-right">
                    {view === "active" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Actions for ${course.name}`}
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => onEdit(course)}>
                            <Pencil className="size-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setPendingArchive(course)}
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
                          restoreCourse(course.id);
                          toast.success(`${course.name} restored`);
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
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {view === "archived"
                      ? "No archived courses."
                      : "No courses match your search."}
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
        title="Delete this course?"
        description={`Are you sure you want to delete ${pendingArchive?.name}? It will be hidden from the active list, but nothing is deleted — you can restore it anytime from "View archived".`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!pendingArchive) return;
          archiveCourse(pendingArchive.id);
          toast.success(`${pendingArchive.name} deleted`);
          if (authUser?.institutionId) {
            notifyInstitution(
              authUser.institutionId,
              "Course deleted",
              `${pendingArchive.name} (${pendingArchive.code}) was removed from the active list.`,
              "/dashboard/academics/courses",
            );
          }
        }}
      />
    </>
  );
}
