"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UnpublishDialog } from "./unpublish-dialog";
import {
  useCourseReview,
  usePublishCourseResult,
} from "@/hooks/use-course-results";
import { adminStatusLabel, statusBadgeClass } from "@/lib/results";
import type { CourseResultListItem } from "@/types/course-result";

interface CourseReviewViewProps {
  course: CourseResultListItem;
  academicSemesterId: string;
  onBack: () => void;
  /** A lecturer's own "View results" is read-only — no Publish/Unpublish actions, those are admin-only. */
  readOnly?: boolean;
}

export function CourseReviewView({
  course,
  academicSemesterId,
  onBack,
  readOnly,
}: CourseReviewViewProps) {
  const { data: review } = useCourseReview(course.courseId, academicSemesterId);
  const publish = usePublishCourseResult();
  const [unpublishOpen, setUnpublishOpen] = useState(false);

  if (!review) {
    return null;
  }

  const label = adminStatusLabel(review.status);

  const handlePublish = async () => {
    try {
      await publish.mutateAsync({
        courseId: course.courseId,
        academicSemesterId,
      });
      toast.success(`${review.courseCode} published`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish");
    }
  };

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            {review.courseCode}
            <Badge className={statusBadgeClass(label, "admin")}>{label}</Badge>
          </h2>
          <p className="text-sm text-muted-foreground">
            School of {review.schoolName} · {review.departmentName}{" "}
            {review.levelCode} Level · {review.scoredStudents} of{" "}
            {review.totalStudents} students scored
          </p>
        </div>
        {!readOnly && review.status === "SUBMITTED" && (
          <Button
            onClick={handlePublish}
            disabled={publish.isPending}
            className="rounded-full px-6"
          >
            Publish
          </Button>
        )}
        {!readOnly && review.status === "PUBLISHED" && (
          <Button
            variant="outline"
            onClick={() => setUnpublishOpen(true)}
            className="rounded-md border-destructive text-destructive hover:bg-destructive/10"
          >
            Unpublish
          </Button>
        )}
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardContent className="overflow-x-auto pt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                {review.components.map((component) => (
                  <TableHead key={component.id}>
                    {component.name} ( {component.weight} )
                  </TableHead>
                ))}
                <TableHead>Overall</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {review.students.map((student) => (
                <TableRow
                  key={student.studentId}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="font-medium text-foreground">
                    {student.studentName}
                  </TableCell>
                  {student.components.map((cell) => (
                    <TableCell
                      key={cell.componentId}
                      className="text-muted-foreground"
                    >
                      {cell.score === null
                        ? "—"
                        : `${cell.score}/${cell.weight}`}
                    </TableCell>
                  ))}
                  <TableCell className="font-medium text-foreground">
                    {student.overall === null
                      ? "—"
                      : `${student.overall}% / ${student.gradeCode}`}
                  </TableCell>
                </TableRow>
              ))}
              {review.students.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={review.components.length + 2}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No students registered for this course yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!readOnly && (
        <UnpublishDialog
          courseId={unpublishOpen ? course.courseId : undefined}
          academicSemesterId={unpublishOpen ? academicSemesterId : undefined}
          courseLabel={review.courseCode}
          onOpenChange={setUnpublishOpen}
        />
      )}
    </div>
  );
}
