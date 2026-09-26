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
import { useDepartmentsStore } from "@/store/departments.store";
import { useFacultiesStore } from "@/store/faculties.store";
import { useProgramsStore } from "@/store/programs.store";
import { PROGRAM_TYPES, type Program, type ProgramType } from "@/types/program";

const PROGRAM_TYPE_OPTIONS = PROGRAM_TYPES.map((value) => ({
  label: value,
  value,
}));

interface ProgramFormValues {
  name: string;
}

interface ProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing program. */
  program?: Program;
}

export function ProgramDialog({
  open,
  onOpenChange,
  program,
}: ProgramDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {program ? "Edit Program" : "Add New Program"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed so switching between "add" and "edit — program X" starts from clean defaults without an effect resetting state. */}
        {open && (
          <ProgramForm
            key={program?.id ?? "new"}
            program={program}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProgramForm({
  program,
  onDone,
}: {
  program?: Program;
  onDone: () => void;
}) {
  const programs = useProgramsStore((state) => state.programs);
  const createProgram = useProgramsStore((state) => state.createProgram);
  const updateProgram = useProgramsStore((state) => state.updateProgram);
  const departments = useDepartmentsStore((state) => state.departments);
  const faculties = useFacultiesStore((state) => state.faculties);
  const activeDepartments = useMemo(
    () => departments.filter((d) => !d.archivedAt),
    [departments],
  );
  const activeFaculties = useMemo(
    () => faculties.filter((f) => !f.archivedAt),
    [faculties],
  );

  const [departmentId, setDepartmentId] = useState(program?.departmentId ?? "");
  const [facultyId, setFacultyId] = useState(program?.facultyId ?? "");
  const [programType, setProgramType] = useState<ProgramType | "">(
    program?.programType ?? "",
  );

  const { register, handleSubmit, formState } = useForm<ProgramFormValues>({
    defaultValues: {
      name: program?.name ?? "",
    },
  });

  const onSubmit = (values: ProgramFormValues) => {
    if (!departmentId || !facultyId || !programType) {
      toast.error("Select a department, faculty, and program type");
      return;
    }
    const name = values.name.trim();
    const duplicate = programs.some(
      (p) =>
        p.id !== program?.id &&
        !p.archivedAt &&
        p.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      toast.error(`A program named "${name}" already exists`);
      return;
    }

    const payload = { name, departmentId, facultyId, programType };

    if (program) {
      updateProgram(program.id, payload);
      toast.success(`${name} updated`);
    } else {
      const created = createProgram(payload);
      toast.success(`${created.name} added`);
    }
    onDone();
  };

  return (
    <>
      <form
        id="program-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 p-6"
      >
        <NotchedField
          label="Program Name"
          labelClassName="bg-popover"
          placeholder="e.g. Computing and IT"
          {...register("name", { required: true })}
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
          label="Faculty"
          labelClassName="bg-popover"
          value={facultyId}
          onValueChange={setFacultyId}
          options={activeFaculties.map((f) => ({ label: f.name, value: f.id }))}
          placeholder="Select faculty"
        />
        <NotchedSelectField
          label="Program Type"
          labelClassName="bg-popover"
          value={programType}
          onValueChange={(value) => setProgramType(value as ProgramType)}
          options={PROGRAM_TYPE_OPTIONS}
          placeholder="Select program type"
        />
      </form>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="submit"
          form="program-form"
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
