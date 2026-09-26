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
import { CourseGradeDialog } from "@/components/features/academics/course-grade-dialog";
import { NotchedField } from "@/components/shared/notched-field";
import { useCourseGradesStore } from "@/store/course-grades.store";
import type { CourseGrade } from "@/types/course-grade";

const PAGE_SIZE_OPTIONS = ["10", "25", "50"];

export default function CourseGradesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<CourseGrade | undefined>();

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Courses Grades"]} />

      <div>
        <h1 className="text-xl font-semibold text-primary">Courses Grades</h1>

        <div className="mt-4">
          <Button
            variant="outline"
            className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground transition-transform hover:scale-[1.02] hover:bg-tertiary/10 active:scale-[0.98]"
            onClick={() => {
              setEditingGrade(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add New
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          <CourseGradeTable
            onEdit={(grade) => {
              setEditingGrade(grade);
              setDialogOpen(true);
            }}
          />
          <MaxGradePointForm />
        </div>
      </div>

      <CourseGradeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        courseGrade={editingGrade}
      />
    </div>
  );
}

function MaxGradePointForm() {
  const maxGradePoint = useCourseGradesStore((state) => state.maxGradePoint);
  const setMaxGradePoint = useCourseGradesStore(
    (state) => state.setMaxGradePoint,
  );
  const [value, setValue] = useState(String(maxGradePoint));

  const handleSave = () => {
    const parsed = Number(value);
    if (!value.trim() || Number.isNaN(parsed) || parsed <= 0) {
      toast.error("Enter a valid max grade point");
      return;
    }
    setMaxGradePoint(parsed);
    toast.success(`Max grade point set to ${parsed}`);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-40">
        <NotchedField
          label="Max Grade Point"
          type="number"
          step="0.1"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
      <Button
        onClick={handleSave}
        className="rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
      >
        Save
      </Button>
    </div>
  );
}

function CourseGradeTable({
  onEdit,
}: {
  onEdit: (grade: CourseGrade) => void;
}) {
  const courseGrades = useCourseGradesStore((state) => state.courseGrades);
  const archiveCourseGrade = useCourseGradesStore(
    (state) => state.archiveCourseGrade,
  );
  const restoreCourseGrade = useCourseGradesStore(
    (state) => state.restoreCourseGrade,
  );

  const [view, setView] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);
  const [pendingArchive, setPendingArchive] = useState<CourseGrade | null>(
    null,
  );

  const baseList = useMemo(
    () =>
      courseGrades.filter((grade) =>
        view === "archived" ? grade.archivedAt : !grade.archivedAt,
      ),
    [courseGrades, view],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return baseList;
    return baseList.filter(
      (grade) =>
        grade.code.toLowerCase().includes(query) ||
        grade.remark.toLowerCase().includes(query),
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
  const archivedCount = courseGrades.filter((g) => g.archivedAt).length;

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
            : "← Back to active grades"}
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
            <Label htmlFor="grade-search" className="text-muted-foreground">
              Filter:
            </Label>
            <Input
              id="grade-search"
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
                <TableHead>Grade Code</TableHead>
                <TableHead>Remark</TableHead>
                <TableHead>Grade Score</TableHead>
                <TableHead>Minimum Score</TableHead>
                <TableHead>Maximum Score</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((grade, index) => (
                <TableRow
                  key={grade.id}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="text-muted-foreground">
                    {rangeStart + index}
                  </TableCell>
                  <TableCell className="font-medium">{grade.code}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {grade.remark}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {grade.gradeScore}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {grade.minimumScore}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {grade.maximumScore}
                  </TableCell>
                  <TableCell className="text-right">
                    {view === "active" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Actions for ${grade.code}`}
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => onEdit(grade)}>
                            <Pencil className="size-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setPendingArchive(grade)}
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
                          restoreCourseGrade(grade.id);
                          toast.success(`${grade.code} restored`);
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
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {view === "archived"
                      ? "No archived grades."
                      : "No grades match your search."}
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
        title="Delete this grade?"
        description={`Are you sure you want to delete grade ${pendingArchive?.code}? It will be hidden from the active list, but nothing is deleted — you can restore it anytime from "View archived".`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!pendingArchive) return;
          archiveCourseGrade(pendingArchive.id);
          toast.success(`${pendingArchive.code} deleted`);
        }}
      />
    </>
  );
}
