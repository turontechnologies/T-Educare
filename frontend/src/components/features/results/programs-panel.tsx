"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  useDepartmentGroupDetail,
  useDepartmentGroups,
} from "@/hooks/use-course-results";
import { adminStatusLabel, statusBadgeClass } from "@/lib/results";

const PAGE_SIZE_OPTIONS = ["5", "10", "25", "50"];

export function ProgramsPanel({
  academicSemesterId,
}: {
  academicSemesterId?: string;
}) {
  const [selected, setSelected] = useState<
    { departmentId: string; programLevelId: string } | undefined
  >();

  if (selected && academicSemesterId) {
    return (
      <DepartmentDetail
        departmentId={selected.departmentId}
        programLevelId={selected.programLevelId}
        academicSemesterId={academicSemesterId}
        onBack={() => setSelected(undefined)}
      />
    );
  }

  return (
    <ProgramsTable
      academicSemesterId={academicSemesterId}
      onSelect={setSelected}
    />
  );
}

function ProgramsTable({
  academicSemesterId,
  onSelect,
}: {
  academicSemesterId?: string;
  onSelect: (group: { departmentId: string; programLevelId: string }) => void;
}) {
  const { data: groups = [] } = useDepartmentGroups(academicSemesterId);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("5");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter((g) => g.departmentName.toLowerCase().includes(query));
  }, [groups, search]);

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
          <Label htmlFor="programs-search" className="text-muted-foreground">
            Search:
          </Label>
          <Input
            id="programs-search"
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
              <TableHead>School</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Completion Count</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((group) => {
              const label = adminStatusLabel(group.status);
              return (
                <TableRow
                  key={`${group.departmentId}-${group.programLevelId}`}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="text-muted-foreground">
                    {group.schoolName}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {group.departmentName}
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      ({group.levelCode} Level)
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {group.submittedCourses} out of {group.totalCourses} courses
                    submitted
                  </TableCell>
                  <TableCell>
                    <Badge className={statusBadgeClass(label, "admin")}>
                      {label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() =>
                        onSelect({
                          departmentId: group.departmentId,
                          programLevelId: group.programLevelId,
                        })
                      }
                      className="cursor-pointer text-sm font-medium text-secondary hover:underline"
                    >
                      View Results
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
            {paginated.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  No programs with courses this semester yet.
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
  );
}

function DepartmentDetail({
  departmentId,
  programLevelId,
  academicSemesterId,
  onBack,
}: {
  departmentId: string;
  programLevelId: string;
  academicSemesterId: string;
  onBack: () => void;
}) {
  const { data: detail } = useDepartmentGroupDetail(
    departmentId,
    programLevelId,
    academicSemesterId,
  );

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("5");
  const [page, setPage] = useState(1);

  const students = detail?.students ?? [];
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((s) => s.studentName.toLowerCase().includes(query));
  }, [students, search]);

  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * size,
    currentPage * size,
  );
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * size + 1;
  const rangeEnd = Math.min(currentPage * size, filtered.length);

  if (!detail) {
    return null;
  }

  const label = adminStatusLabel(detail.status);

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Programs
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            {detail.departmentName} {detail.levelCode} Level
            <Badge className={statusBadgeClass(label, "admin")}>{label}</Badge>
          </h2>
          <p className="text-sm text-muted-foreground">
            School of {detail.schoolName} · {detail.submittedCourses} of{" "}
            {detail.totalCourses} courses submitted
          </p>
        </div>
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
              htmlFor="dept-detail-search"
              className="text-muted-foreground"
            >
              Search:
            </Label>
            <Input
              id="dept-detail-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="h-8 w-56"
            />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                {detail.courses.map((course) => (
                  <TableHead key={course.courseId}>
                    {course.courseCode}
                  </TableHead>
                ))}
                <TableHead>Overall</TableHead>
                <TableHead>GPA</TableHead>
                <TableHead>CGPA</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((student) => (
                <TableRow
                  key={student.studentId}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="font-medium text-foreground">
                    {student.studentName}
                  </TableCell>
                  {student.perCourse.map((cell) => (
                    <TableCell
                      key={cell.courseId}
                      className="text-muted-foreground"
                    >
                      {cell.score === null
                        ? "—"
                        : `${cell.score} / ${cell.gradeCode}`}
                    </TableCell>
                  ))}
                  <TableCell className="font-medium text-foreground">
                    {student.overallPercent === null
                      ? "—"
                      : `${student.overallPercent}% / ${student.overallGradeCode}`}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.gpa ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.cgpa ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <GraduationCap className="size-3.5" />
                      View result
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={detail.courses.length + 4}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No students registered in this group yet.
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
    </div>
  );
}
