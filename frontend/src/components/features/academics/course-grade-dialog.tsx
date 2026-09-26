"use client";

import { useForm } from "react-hook-form";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { NotchedField } from "@/components/shared/notched-field";
import { useCourseGradesStore } from "@/store/course-grades.store";
import type { CourseGrade } from "@/types/course-grade";

interface CourseGradeFormValues {
  code: string;
  remark: string;
  gradeScore: number;
  minimumScore: number;
  maximumScore: number;
}

interface CourseGradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing grade band. */
  courseGrade?: CourseGrade;
}

export function CourseGradeDialog({
  open,
  onOpenChange,
  courseGrade,
}: CourseGradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {courseGrade ? "Edit Grade" : "Add New Grade"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed so switching between "add" and "edit — grade X" starts from clean defaults without an effect resetting state. */}
        {open && (
          <CourseGradeForm
            key={courseGrade?.id ?? "new"}
            courseGrade={courseGrade}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CourseGradeForm({
  courseGrade,
  onDone,
}: {
  courseGrade?: CourseGrade;
  onDone: () => void;
}) {
  const courseGrades = useCourseGradesStore((state) => state.courseGrades);
  const createCourseGrade = useCourseGradesStore(
    (state) => state.createCourseGrade,
  );
  const updateCourseGrade = useCourseGradesStore(
    (state) => state.updateCourseGrade,
  );

  const { register, handleSubmit, formState } = useForm<CourseGradeFormValues>({
    defaultValues: {
      code: courseGrade?.code ?? "",
      remark: courseGrade?.remark ?? "",
      gradeScore: courseGrade?.gradeScore ?? 0,
      minimumScore: courseGrade?.minimumScore ?? 0,
      maximumScore: courseGrade?.maximumScore ?? 0,
    },
  });

  const onSubmit = (values: CourseGradeFormValues) => {
    const code = values.code.trim();
    const minimumScore = Number(values.minimumScore);
    const maximumScore = Number(values.maximumScore);

    const duplicate = courseGrades.some(
      (g) =>
        g.id !== courseGrade?.id &&
        !g.archivedAt &&
        g.code.toLowerCase() === code.toLowerCase(),
    );
    if (duplicate) {
      toast.error(`Grade code "${code}" already exists`);
      return;
    }
    if (maximumScore <= minimumScore) {
      toast.error("Maximum score must be greater than minimum score");
      return;
    }

    const payload = {
      code,
      remark: values.remark.trim(),
      gradeScore: Number(values.gradeScore),
      minimumScore,
      maximumScore,
    };

    if (courseGrade) {
      updateCourseGrade(courseGrade.id, payload);
      toast.success(`${code} updated`);
    } else {
      const created = createCourseGrade(payload);
      toast.success(`${created.code} added`);
    }
    onDone();
  };

  return (
    <>
      <form
        id="course-grade-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 p-6"
      >
        <NotchedField
          label="Grade Code"
          labelClassName="bg-popover"
          placeholder="e.g. A"
          {...register("code", { required: true })}
        />
        <NotchedField
          label="Remark"
          labelClassName="bg-popover"
          placeholder="e.g. Distinction"
          {...register("remark", { required: true })}
        />
        <NotchedField
          label="Grade Score"
          labelClassName="bg-popover"
          type="number"
          step="0.1"
          {...register("gradeScore", { required: true, valueAsNumber: true })}
        />
        <div className="grid grid-cols-2 gap-4">
          <NotchedField
            label="Minimum Score"
            labelClassName="bg-popover"
            type="number"
            step="0.01"
            {...register("minimumScore", {
              required: true,
              valueAsNumber: true,
            })}
          />
          <NotchedField
            label="Maximum Score"
            labelClassName="bg-popover"
            type="number"
            step="0.01"
            {...register("maximumScore", {
              required: true,
              valueAsNumber: true,
            })}
          />
        </div>
      </form>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="submit"
          form="course-grade-form"
          disabled={formState.isSubmitting}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Save
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
