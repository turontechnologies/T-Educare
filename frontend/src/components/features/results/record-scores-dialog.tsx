"use client";

import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useComponentScores,
  useSaveComponentScores,
} from "@/hooks/use-course-results";
import type { ComponentProgress } from "@/types/course-result";

interface RecordScoresDialogProps {
  courseId?: string;
  academicSemesterId?: string;
  component?: ComponentProgress;
  onOpenChange: (open: boolean) => void;
}

export function RecordScoresDialog({
  courseId,
  academicSemesterId,
  component,
  onOpenChange,
}: RecordScoresDialogProps) {
  const open = !!courseId && !!academicSemesterId && !!component;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <RecordScoresContent
          key={component!.componentId}
          courseId={courseId!}
          academicSemesterId={academicSemesterId!}
          componentId={component!.componentId}
          componentName={component!.componentName}
          weight={component!.weight}
          onOpenChange={onOpenChange}
        />
      )}
    </Dialog>
  );
}

function RecordScoresContent({
  courseId,
  academicSemesterId,
  componentId,
  componentName,
  weight,
  onOpenChange,
}: {
  courseId: string;
  academicSemesterId: string;
  componentId: string;
  componentName: string;
  weight: number;
  onOpenChange: (open: boolean) => void;
}) {
  const { data } = useComponentScores(
    courseId,
    componentId,
    academicSemesterId,
  );
  const saveScores = useSaveComponentScores();

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (data?.students ?? []).map((s) => [
        s.studentId,
        s.score === null ? "" : String(s.score),
      ]),
    ),
  );

  const handleSave = async () => {
    const scores = Object.entries(values)
      .filter(([, value]) => value.trim() !== "")
      .map(([studentId, value]) => ({ studentId, score: Number(value) }));

    if (
      scores.some(
        (s) => !Number.isFinite(s.score) || s.score < 0 || s.score > weight,
      )
    ) {
      toast.error(`Every score must be between 0 and ${weight}`);
      return;
    }
    if (scores.length === 0) {
      toast.error("Enter at least one score");
      return;
    }

    try {
      await saveScores.mutateAsync({
        courseId,
        componentId,
        academicSemesterId,
        scores,
      });
      toast.success(`${componentName} scores saved`);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save scores",
      );
    }
  };

  return (
    <DialogContent
      showCloseButton={false}
      className="flex max-h-[85vh] w-full max-w-md flex-col gap-0 overflow-hidden p-0"
    >
      <div className="flex items-center justify-between bg-primary px-6 py-4">
        <DialogTitle className="text-base font-medium text-white">
          Record {componentName} Scores
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

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-2 grid grid-cols-[1fr_auto] gap-3">
          <span className="text-xs text-muted-foreground">Student name</span>
          <span className="text-xs text-muted-foreground">
            Score ( {weight} )
          </span>
        </div>
        <div className="space-y-2">
          {(data?.students ?? []).map((student) => (
            <div
              key={student.studentId}
              className="grid grid-cols-[1fr_auto] items-center gap-3"
            >
              <Input
                value={student.studentName}
                readOnly
                disabled
                className="h-10 bg-muted"
              />
              <Input
                type="number"
                min={0}
                max={weight}
                value={values[student.studentId] ?? ""}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    [student.studentId]: event.target.value,
                  }))
                }
                className="h-10 w-24"
              />
            </div>
          ))}
          {(data?.students ?? []).length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No students registered for this course yet.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          disabled={saveScores.isPending}
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
