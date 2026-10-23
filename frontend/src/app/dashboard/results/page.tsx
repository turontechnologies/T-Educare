"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  GraduationCap,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NotchedField } from "@/components/shared/notched-field";
import { PageHeader } from "@/components/shared/page-header";
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
import { EnterResultDialog } from "@/components/features/results/enter-result-dialog";
import {
  useCourseResultsForCourse,
  useDeleteCourseResult,
  useMyResultCourses,
  useStudentCgpa,
  useUpdateCourseResult,
} from "@/hooks/use-course-results";
import { useAuthStore } from "@/store/auth.store";
import { useAcademicsStore } from "@/store/academics.store";
import { useCoursesStore } from "@/store/courses.store";
import { useStudentsStore } from "@/store/students.store";
import type { CourseResult } from "@/types/course-result";

const PAGE_SIZE_OPTIONS = ["10", "25", "50"];

export default function ResultsManagementPage() {
  const user = useAuthStore((state) => state.user);
  const isLecturerSelfService = !!user?.lecturerId;

  const semesters = useAcademicsStore((state) => state.semesters);
  const activeSemesters = useMemo(
    () => semesters.filter((s) => !s.archivedAt),
    [semesters],
  );
  const [academicSemesterId, setAcademicSemesterId] = useState(
    () => activeSemesters.find((s) => s.isCurrent)?.id ?? "",
  );

  const allCourses = useCoursesStore((state) => state.courses);
  const { data: myCourses = [] } = useMyResultCourses({
    enabled: isLecturerSelfService,
  });
  const selectableCourses = isLecturerSelfService
    ? myCourses
    : allCourses.filter((c) => !c.archivedAt);
  const [courseId, setCourseId] = useState("");

  const { data: results = [] } = useCourseResultsForCourse(
    courseId || undefined,
    academicSemesterId || undefined,
  );
  const deleteResult = useDeleteCourseResult();

  const [enterOpen, setEnterOpen] = useState(false);
  const [editing, setEditing] = useState<CourseResult | undefined>();
  const [pendingDelete, setPendingDelete] = useState<
    CourseResult | undefined
  >();

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return results;
    return results.filter(
      (r) =>
        r.studentName.toLowerCase().includes(query) ||
        r.studentMatricNo.toLowerCase().includes(query),
    );
  }, [results, search]);

  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * size,
    currentPage * size,
  );
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * size + 1;
  const rangeEnd = Math.min(currentPage * size, filtered.length);

  const selectedCourse = selectableCourses.find((c) => c.id === courseId);

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Results Management"]} />

      <div>
        <h1 className="text-xl font-semibold text-primary">
          Results Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLecturerSelfService
            ? "Enter results for your own courses, or your whole department's if you're its HOD."
            : "Enter and review student results per course and semester."}
        </p>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardContent className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-muted-foreground">
              Semester
            </label>
            <Select
              value={academicSemesterId || null}
              onValueChange={(value) => setAcademicSemesterId(value ?? "")}
              items={activeSemesters.map((s) => ({
                label: s.name,
                value: s.id,
              }))}
            >
              <SelectTrigger className="h-10 w-full justify-between rounded-md">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {activeSemesters.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                    {s.isCurrent ? " (current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-muted-foreground">
              Course
            </label>
            <Select
              value={courseId || null}
              onValueChange={(value) => setCourseId(value ?? "")}
              items={selectableCourses.map((c) => ({
                label: `${c.code} — ${c.name}`,
                value: c.id,
              }))}
            >
              <SelectTrigger className="h-10 w-full justify-between rounded-md">
                <SelectValue
                  placeholder={
                    selectableCourses.length === 0
                      ? isLecturerSelfService
                        ? "No courses assigned to you this session"
                        : "Select course"
                      : "Select course"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {selectableCourses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {courseId && academicSemesterId && (
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
              <div className="flex items-center gap-2 text-sm">
                <Label
                  htmlFor="results-search"
                  className="text-muted-foreground"
                >
                  Filter:
                </Label>
                <Input
                  id="results-search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Matric number or name"
                  className="h-8 w-56"
                />
              </div>
              <Button
                variant="outline"
                className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground"
                onClick={() => setEnterOpen(true)}
              >
                <Plus className="size-4" />
                Enter Result
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matric No.</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((result) => (
                  <TableRow
                    key={result.id}
                    className="animate-in fade-in duration-300"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {result.studentMatricNo}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {result.studentName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {result.score}
                    </TableCell>
                    <TableCell>
                      {result.gradeCode ? (
                        <Badge className="bg-secondary/10 text-secondary">
                          {result.gradeCode} ({result.gradePoint})
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No band matches
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Actions for ${result.studentName}`}
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => setEditing(result)}>
                            <Pencil className="size-3.5" />
                            Edit score
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setPendingDelete(result)}
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
                      No results entered for{" "}
                      {selectedCourse?.code ?? "this course"} yet this semester.
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
      )}

      <StudentGpaLookup academicSemesterId={academicSemesterId} />

      <EnterResultDialog
        open={enterOpen}
        onOpenChange={setEnterOpen}
        courseId={courseId || undefined}
        academicSemesterId={academicSemesterId || undefined}
        alreadyScoredStudentIds={results.map((r) => r.studentId)}
      />

      <EditScoreDialog
        result={editing}
        onOpenChange={(open) => !open && setEditing(undefined)}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(undefined)}
        title="Delete this result?"
        description={`Are you sure you want to delete ${pendingDelete?.studentName}'s result for ${pendingDelete?.courseCode}? This can't be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteResult.mutateAsync(pendingDelete.id);
            toast.success("Result deleted");
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to delete result",
            );
          }
        }}
      />
    </div>
  );
}

function EditScoreDialog({
  result,
  onOpenChange,
}: {
  result?: CourseResult;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!result} onOpenChange={onOpenChange}>
      {result && (
        <EditScoreDialogBody
          key={result.id}
          result={result}
          onOpenChange={onOpenChange}
        />
      )}
    </Dialog>
  );
}

/** Keyed by `result.id` from the parent so its score state always starts fresh for whichever row was just clicked, instead of carrying over the previous row's edited value. */
function EditScoreDialogBody({
  result,
  onOpenChange,
}: {
  result: CourseResult;
  onOpenChange: (open: boolean) => void;
}) {
  const updateResult = useUpdateCourseResult();
  const [score, setScore] = useState(String(result.score));

  const handleSave = async () => {
    const parsed = Number(score);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      toast.error("Score must be a number between 0 and 100");
      return;
    }
    try {
      await updateResult.mutateAsync({ id: result.id, score: parsed });
      toast.success("Score updated");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update score",
      );
    }
  };

  return (
    <DialogContent
      showCloseButton={false}
      className="w-full max-w-md gap-0 overflow-hidden p-0"
    >
      <div className="flex items-center justify-between bg-primary px-6 py-4">
        <DialogTitle className="text-base font-medium text-white">
          Edit {result.studentName}&apos;s score
        </DialogTitle>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="cursor-pointer text-white/80 transition-colors hover:text-white"
        >
          <X className="size-5" />
          <span className="sr-only">Close</span>
        </button>
      </div>

      <div className="space-y-5 p-6">
        <NotchedField
          label="Score (0–100)"
          labelClassName="bg-popover"
          type="number"
          min={0}
          max={100}
          value={score}
          onChange={(event) => setScore(event.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          disabled={updateResult.isPending}
          onClick={handleSave}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Save
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </DialogContent>
  );
}

function StudentGpaLookup({
  academicSemesterId,
}: {
  academicSemesterId: string;
}) {
  const students = useStudentsStore((state) => state.students);
  const [studentId, setStudentId] = useState("");
  const { data: cgpa } = useStudentCgpa(studentId || undefined);
  const semesterGpa = cgpa?.bySemester.find(
    (g) => g.academicSemesterId === academicSemesterId,
  );

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
      <CardHeader>
        <p className="text-sm font-medium text-foreground">
          Student GPA / CGPA Lookup
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <Select
          value={studentId || null}
          onValueChange={(value) => setStudentId(value ?? "")}
          items={students
            .filter((s) => !s.archivedAt)
            .map((s) => ({
              label: `${s.matricNo ?? s.preAdmissionId} — ${s.firstName} ${s.lastName}`,
              value: s.id,
            }))}
        >
          <SelectTrigger className="h-10 w-full max-w-md justify-between rounded-md sm:w-96">
            <SelectValue placeholder="Search a student" />
          </SelectTrigger>
          <SelectContent>
            {students
              .filter((s) => !s.archivedAt)
              .map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.matricNo ?? s.preAdmissionId} — {s.firstName} {s.lastName}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {studentId && cgpa && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <GpaStat
              label="This semester's GPA"
              value={semesterGpa?.gpa ?? null}
            />
            <GpaStat label="CGPA" value={cgpa.cgpa} />
            <GpaStat
              label="Total units (CGPA)"
              value={cgpa.totalUnits}
              isCount
            />
            <GpaStat label="Courses counted" value={cgpa.courseCount} isCount />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GpaStat({
  label,
  value,
  isCount,
}: {
  label: string;
  value: number | null;
  isCount?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/40 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-center justify-center gap-1 text-lg font-semibold text-foreground">
        {!isCount && <GraduationCap className="size-4 text-secondary" />}
        {value === null ? "—" : value}
      </p>
    </div>
  );
}
