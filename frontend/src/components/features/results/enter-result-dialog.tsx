"use client";

import { useMemo, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import { useCourseRegistrationsForCourse } from "@/hooks/use-registration";
import { useCreateCourseResult } from "@/hooks/use-course-results";
import { useStudentsStore } from "@/store/students.store";

interface EnterResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId?: string;
  academicSemesterId?: string;
  /** Students who already have a result, so they're excluded from the picker — editing an existing score happens from the table row instead. */
  alreadyScoredStudentIds: string[];
}

/** Only offers students genuinely registered for this course this semester — not the whole student body — so a score can never be entered for someone who never took the course. */
export function EnterResultDialog({
  open,
  onOpenChange,
  courseId,
  academicSemesterId,
  alreadyScoredStudentIds,
}: EnterResultDialogProps) {
  const { data: registrations = [] } = useCourseRegistrationsForCourse(
    courseId,
    academicSemesterId,
    { enabled: open },
  );
  const students = useStudentsStore((state) => state.students);
  const createResult = useCreateCourseResult();

  const [studentId, setStudentId] = useState("");
  const [score, setScore] = useState("");

  const eligible = useMemo(() => {
    const scored = new Set(alreadyScoredStudentIds);
    return registrations
      .filter((r) => !scored.has(r.studentId))
      .map((r) => students.find((s) => s.id === r.studentId))
      .filter((s): s is NonNullable<typeof s> => !!s);
  }, [registrations, students, alreadyScoredStudentIds]);

  const handleSave = async () => {
    if (!courseId || !academicSemesterId) return;
    if (!studentId) {
      toast.error("Select a student");
      return;
    }
    const parsed = Number(score);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      toast.error("Score must be a number between 0 and 100");
      return;
    }
    try {
      await createResult.mutateAsync({
        studentId,
        courseId,
        academicSemesterId,
        score: parsed,
      });
      toast.success("Result entered");
      setStudentId("");
      setScore("");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to enter result",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Enter Result
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
          <NotchedSelectField
            label="Student"
            labelClassName="bg-popover"
            value={studentId}
            onValueChange={setStudentId}
            options={eligible.map((s) => ({
              label: `${s.matricNo ?? s.preAdmissionId} — ${s.firstName} ${s.lastName}`,
              value: s.id,
            }))}
            placeholder={
              eligible.length === 0
                ? "No unscored registered students left"
                : "Select a student"
            }
            disabled={eligible.length === 0}
          />
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
            disabled={createResult.isPending}
            onClick={handleSave}
            className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Save
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
