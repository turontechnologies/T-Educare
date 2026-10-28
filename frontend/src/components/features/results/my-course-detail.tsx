"use client";

import { useState } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecordScoresDialog } from "./record-scores-dialog";
import {
  useMyCourseProgress,
  useSubmitCourseResult,
} from "@/hooks/use-course-results";
import { statusBadgeClass, teacherStatusLabel } from "@/lib/results";
import type {
  ComponentProgress,
  CourseResultListItem,
} from "@/types/course-result";

interface MyCourseDetailProps {
  course: CourseResultListItem;
  academicSemesterId: string;
  onBack: () => void;
}

const COMPONENT_BADGE: Record<string, string> = {
  NOT_STARTED: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-amber-500/10 text-amber-600",
  RECORDED: "bg-emerald-500/10 text-emerald-600",
};

const COMPONENT_LABEL: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  RECORDED: "Recorded",
};

export function MyCourseDetail({
  course,
  academicSemesterId,
  onBack,
}: MyCourseDetailProps) {
  const { data: progress } = useMyCourseProgress(
    course.courseId,
    academicSemesterId,
  );
  const submit = useSubmitCourseResult();
  const [recordingComponent, setRecordingComponent] = useState<
    ComponentProgress | undefined
  >();

  if (!progress) {
    return null;
  }

  const label = teacherStatusLabel(
    progress.status,
    course.scoredStudents,
    progress.totalStudents,
  );

  const handleSubmit = async () => {
    try {
      await submit.mutateAsync({
        courseId: course.courseId,
        academicSemesterId,
      });
      toast.success(`${progress.courseCode} submitted`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit");
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
        Back to My Courses
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          {progress.courseCode}
        </h2>
        <Badge className={statusBadgeClass(label, "teacher")}>{label}</Badge>
        {progress.deadlineLabel && (
          <Badge variant="outline" className="rounded-md text-destructive">
            {progress.deadlineLabel}
          </Badge>
        )}
      </div>
      <p className="-mt-2 text-sm text-muted-foreground">
        {progress.schoolName} · {progress.departmentName} {progress.levelCode}{" "}
        Level · {progress.totalStudents} of {progress.totalStudents} students
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {progress.components.map((component) => {
          const percent =
            progress.totalStudents === 0
              ? 0
              : (component.scoredStudents / progress.totalStudents) * 100;
          return (
            <div
              key={component.componentId}
              className="animate-in fade-in rounded-lg border border-border bg-card p-5 duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                    {component.componentName.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">
                      {component.componentName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Out of {component.weight}
                    </p>
                  </div>
                </div>
                <Badge className={COMPONENT_BADGE[component.status]}>
                  {COMPONENT_LABEL[component.status]}
                </Badge>
              </div>

              <p className="mt-4 text-sm font-medium text-foreground">
                {component.scoredStudents} / {progress.totalStudents} students
              </p>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <Button
                className="mt-4 w-full rounded-full"
                variant={
                  component.status === "RECORDED" ? "outline" : "default"
                }
                onClick={() => setRecordingComponent(component)}
              >
                {component.status === "NOT_STARTED"
                  ? `Record ${component.componentName} scores`
                  : component.status === "RECORDED"
                    ? "View / edit scores"
                    : "Continue recording"}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <AlertCircle className="size-4" />
          Record every bucket for all {progress.totalStudents} students to
          enable submission.
        </p>
        <Button
          disabled={
            !progress.canSubmit ||
            submit.isPending ||
            progress.status !== "IN_PROGRESS"
          }
          onClick={handleSubmit}
          className="rounded-full px-6"
        >
          Review &amp; Submit results
        </Button>
      </div>

      <RecordScoresDialog
        courseId={course.courseId}
        academicSemesterId={academicSemesterId}
        component={recordingComponent}
        onOpenChange={(open) => !open && setRecordingComponent(undefined)}
      />
    </div>
  );
}
