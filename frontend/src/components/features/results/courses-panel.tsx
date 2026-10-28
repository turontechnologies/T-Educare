"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, History } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CourseHistoryDialog } from "./course-history-dialog";
import { CourseReviewView } from "./course-review-view";
import { useCourseResultList } from "@/hooks/use-course-results";
import { adminStatusLabel, statusBadgeClass } from "@/lib/results";
import type { CourseResultListItem } from "@/types/course-result";

const PAGE_SIZE_OPTIONS = ["5", "10", "25", "50"];

export function CoursesPanel({
  academicSemesterId,
}: {
  academicSemesterId?: string;
}) {
  const [reviewing, setReviewing] = useState<
    CourseResultListItem | undefined
  >();

  if (reviewing && academicSemesterId) {
    return (
      <CourseReviewView
        course={reviewing}
        academicSemesterId={academicSemesterId}
        onBack={() => setReviewing(undefined)}
      />
    );
  }

  return (
    <CoursesTable
      academicSemesterId={academicSemesterId}
      onReview={setReviewing}
    />
  );
}

function CoursesTable({
  academicSemesterId,
  onReview,
}: {
  academicSemesterId?: string;
  onReview: (course: CourseResultListItem) => void;
}) {
  const { data: courses = [] } = useCourseResultList(academicSemesterId);
  const [historyFor, setHistoryFor] = useState<
    CourseResultListItem | undefined
  >();

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
    <>
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
              htmlFor="courses-results-search"
              className="text-muted-foreground"
            >
              Search:
            </Label>
            <Input
              id="courses-results-search"
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
                <TableHead>Course Name</TableHead>
                <TableHead>Course Code</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Lecturer</TableHead>
                <TableHead>Completion Count</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((course) => {
                const label = adminStatusLabel(course.status);
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
                      {course.lecturerName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {course.scoredStudents} out of {course.totalStudents}{" "}
                      students scored
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadgeClass(label, "admin")}>
                        {label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => onReview(course)}
                          className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-secondary hover:underline"
                        >
                          <ClipboardCheck className="size-3.5" />
                          Review
                        </button>
                        <button
                          type="button"
                          onClick={() => setHistoryFor(course)}
                          className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          <History className="size-3.5" />
                          History
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No courses found.
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

      <CourseHistoryDialog
        courseId={historyFor?.courseId}
        academicSemesterId={historyFor?.academicSemesterId}
        onOpenChange={(open) => !open && setHistoryFor(undefined)}
      />
    </>
  );
}
