"use client";

import { useMemo, useState } from "react";
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
import {
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import { useCreateCourse, useUpdateCourse } from "@/hooks/use-courses";
import { fullName } from "@/lib/staff-members";
import { useCoursesStore } from "@/store/courses.store";
import { useDepartmentsStore } from "@/store/departments.store";
import { useProgramLevelsStore } from "@/store/program-levels.store";
import { useSchoolsStore } from "@/store/schools.store";
import { useStaffMembersStore } from "@/store/staff-members.store";
import type { Course } from "@/types/course";

interface CourseFormValues {
  name: string;
  code: string;
  unit: number;
}

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing course. */
  course?: Course;
}

export function CourseDialog({
  open,
  onOpenChange,
  course,
}: CourseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {course ? "Edit Course" : "Add New Course"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed so switching between "add" and "edit — course X" starts from clean defaults without an effect resetting state. */}
        {open && (
          <CourseForm
            key={course?.id ?? "new"}
            course={course}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CourseForm({
  course,
  onDone,
}: {
  course?: Course;
  onDone: () => void;
}) {
  const courses = useCoursesStore((state) => state.courses);
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const departments = useDepartmentsStore((state) => state.departments);
  const schools = useSchoolsStore((state) => state.schools);
  const programLevels = useProgramLevelsStore((state) => state.programLevels);
  const staffMembers = useStaffMembersStore((state) => state.staffMembers);
  const activeDepartments = useMemo(
    () => departments.filter((d) => !d.archivedAt),
    [departments],
  );
  const activeSchools = useMemo(
    () => schools.filter((s) => !s.archivedAt),
    [schools],
  );
  const activeProgramLevels = useMemo(
    () => programLevels.filter((l) => !l.archivedAt),
    [programLevels],
  );
  const activeStaffMembers = useMemo(
    () => staffMembers.filter((s) => !s.archivedAt),
    [staffMembers],
  );

  const [departmentId, setDepartmentId] = useState(course?.departmentId ?? "");
  const [schoolId, setSchoolId] = useState(course?.schoolId ?? "");
  const [programLevelId, setProgramLevelId] = useState(
    course?.programLevelId ?? "",
  );
  const [lecturerId, setLecturerId] = useState(course?.lecturerId ?? "");

  const { register, handleSubmit, formState } = useForm<CourseFormValues>({
    defaultValues: {
      name: course?.name ?? "",
      code: course?.code ?? "",
      unit: course?.unit ?? 3,
    },
  });

  const onSubmit = async (values: CourseFormValues) => {
    if (!departmentId || !schoolId || !programLevelId) {
      toast.error("Select a department, school, and program level");
      return;
    }
    const code = values.code.trim();
    const duplicate = courses.some(
      (c) =>
        c.id !== course?.id &&
        !c.archivedAt &&
        c.code.toLowerCase() === code.toLowerCase(),
    );
    if (duplicate) {
      toast.error(`Course code "${code}" already exists`);
      return;
    }

    const payload = {
      name: values.name.trim(),
      code,
      departmentId,
      schoolId,
      programLevelId,
      unit: Number(values.unit),
      lecturerId,
    };

    try {
      if (course) {
        await updateCourse.mutateAsync({ id: course.id, payload });
        toast.success(`${payload.name} updated`);
      } else {
        const created = await createCourse.mutateAsync(payload);
        toast.success(`${created.name} added`);
      }
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save course",
      );
    }
  };

  return (
    <>
      <form
        id="course-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 p-6"
      >
        <NotchedField
          label="Course Name"
          labelClassName="bg-popover"
          placeholder="e.g. Pure Mathematics"
          {...register("name", { required: true })}
        />
        <NotchedField
          label="Course Code"
          labelClassName="bg-popover"
          placeholder="e.g. MAT101"
          {...register("code", { required: true })}
        />
        <NotchedSelectField
          label="Department"
          labelClassName="bg-popover"
          value={departmentId}
          onValueChange={setDepartmentId}
          options={activeDepartments.map((d) => ({
            label: d.name,
            value: d.id,
          }))}
          placeholder="Select department"
        />
        <NotchedSelectField
          label="School"
          labelClassName="bg-popover"
          value={schoolId}
          onValueChange={setSchoolId}
          options={activeSchools.map((s) => ({ label: s.name, value: s.id }))}
          placeholder="Select school"
        />
        <NotchedSelectField
          label="Program Level"
          labelClassName="bg-popover"
          value={programLevelId}
          onValueChange={setProgramLevelId}
          options={activeProgramLevels.map((l) => ({
            label: l.levelCode,
            value: l.id,
          }))}
          placeholder="Select level"
        />
        <NotchedField
          label="Unit"
          labelClassName="bg-popover"
          type="number"
          min={1}
          max={10}
          {...register("unit", { required: true, valueAsNumber: true })}
        />
        <NotchedSelectField
          label="Lecturer (optional)"
          labelClassName="bg-popover"
          value={lecturerId || "none"}
          onValueChange={(value) =>
            setLecturerId(value === "none" ? "" : value)
          }
          options={[
            { label: "Unassigned", value: "none" },
            ...activeStaffMembers.map((s) => ({
              label: `${fullName(s)} (${s.staffId})`,
              value: s.id,
            })),
          ]}
          placeholder="Unassigned"
        />
      </form>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="submit"
          form="course-form"
          disabled={
            formState.isSubmitting ||
            createCourse.isPending ||
            updateCourse.isPending
          }
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Save
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
