"use client";

import { useMemo, useState } from "react";
import { Calendar, MoreHorizontal } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MyCourseDetail } from "./my-course-detail";
import { CourseReviewView } from "./course-review-view";
import { useCourseResultList } from "@/hooks/use-course-results";
import { statusBadgeClass, teacherStatusLabel } from "@/lib/results";
import { useAcademicsStore } from "@/store/academics.store";
import type { CourseResultListItem } from "@/types/course-result";

const PAGE_SIZE_OPTIONS = ["5", "10", "25", "50"];

export function TeacherResultsView() {
  const semesters = useAcademicsStore((state) => state.semesters);
  const currentSemester = semesters.find((s) => s.isCurrent && !s.archivedAt);

  const [recording, setRecording] = useState<
    CourseResultListItem | undefined
  >();
  const [viewing, setViewing] = useState<CourseResultListItem | undefined>();

  if (recording && currentSemester) {
    return (
      <MyCourseDetail
        course={recording}
        academicSemesterId={currentSemester.id}
        onBack={() => setRecording(undefined)}
      />
    );
  }

  if (viewing && currentSemester) {
    return (
      <CourseReviewView
        course={viewing}
        academicSemesterId={currentSemester.id}
        onBack={() => setViewing(undefined)}
        readOnly
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="gap-1.5 rounded-md py-1.5 text-xs">
          <Calendar className="size-3.5" />
          Current Session: {currentSemester?.name.split(" ")[0] ?? "—"}
        </Badge>
        <Badge variant="outline" className="gap-1.5 rounded-md py-1.5 text-xs">
          <Calendar className="size-3.5" />
          Current Semester: {currentSemester?.name ?? "—"}
        </Badge>
      </div>

      <MyCoursesTable
        academicSemesterId={currentSemester?.id}
        onRecord={setRecording}
        onView={setViewing}
      />
    </div>
  );
}

function MyCoursesTable({
  academicSemesterId,
  onRecord,
  onView,
}: {
  academicSemesterId?: string;
  onRecord: (course: CourseResultListItem) => void;
  onView: (course: CourseResultListItem) => void;
}) {
  const { data: courses = [] } = useCourseResultList(academicSemesterId);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("5");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return courses;
    return courses.filter(
      (c) =>
        c.courseName.toLowerCase().includes(query) ||
        c.courseCode.toLowerCase().includes(query),
    );
  }, [courses, search]);

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
        <h2 className="text-sm font-semibold text-foreground">My Courses</h2>
        <div className="flex flex-wrap items-center gap-4">
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
              htmlFor="my-courses-search"
              className="text-muted-foreground"
            >
              Search:
            </Label>
            <Input
              id="my-courses-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="h-8 w-56"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Name</TableHead>
              <TableHead>Course Code</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Completion Count</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((course) => {
              const label = teacherStatusLabel(
                course.status,
                course.scoredStudents,
                course.totalStudents,
              );
              return (
                <TableRow
                  key={course.courseId}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="font-medium text-foreground">
                    {course.courseName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {course.courseCode}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {course.departmentName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {course.schoolName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {course.scoredStudents} out of {course.totalStudents}{" "}
                    students scored
                  </TableCell>
                  <TableCell>
                    <Badge className={statusBadgeClass(label, "teacher")}>
                      {label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Actions for ${course.courseName}`}
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => onRecord(course)}>
                          {course.status === "IN_PROGRESS"
                            ? "Record scores"
                            : "View scores"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onView(course)}>
                          View results
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {paginated.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-muted-foreground"
                >
                  No courses assigned to you this semester.
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
