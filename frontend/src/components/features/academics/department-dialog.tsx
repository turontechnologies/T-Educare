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
  NotchedComboboxField,
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import { notifyInstitution } from "@/lib/notify";
import { useAuthStore } from "@/store/auth.store";
import { useDepartmentsStore } from "@/store/departments.store";
import { useFacultiesStore } from "@/store/faculties.store";
import { useSchoolsStore } from "@/store/schools.store";
import type { Department } from "@/types/department";

/**
 * No general "staff directory" exists yet to pick a real person from — this
 * is a small curated candidate list local to this dialog, same convention
 * as School Management's "School Head" and Faculty Management's "Dean of
 * Faculty" fields.
 */
const HOD_CANDIDATES = [
  "Dr. Solomon Olusegun",
  "Alh. Mustapha George",
  "Prof. Ngozi Eze",
  "Chief Adebayo Fashola",
  "Engr. Chukwuemeka Okafor",
  "Alh. Gbenga Olusegun",
  "Dr. Amina Bello",
];

interface DepartmentFormValues {
  name: string;
}

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing department. */
  department?: Department;
}

export function DepartmentDialog({
  open,
  onOpenChange,
  department,
}: DepartmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {department ? "Edit Department" : "Add New Department"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed so switching between "add" and "edit — department X" starts from clean defaults without an effect resetting state. */}
        {open && (
          <DepartmentForm
            key={department?.id ?? "new"}
            department={department}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DepartmentForm({
  department,
  onDone,
}: {
  department?: Department;
  onDone: () => void;
}) {
  const authUser = useAuthStore((state) => state.user);
  const departments = useDepartmentsStore((state) => state.departments);
  const createDepartment = useDepartmentsStore(
    (state) => state.createDepartment,
  );
  const updateDepartment = useDepartmentsStore(
    (state) => state.updateDepartment,
  );
  const faculties = useFacultiesStore((state) => state.faculties);
  const schools = useSchoolsStore((state) => state.schools);
  const activeFaculties = useMemo(
    () => faculties.filter((f) => !f.archivedAt),
    [faculties],
  );
  const activeSchools = useMemo(
    () => schools.filter((s) => !s.archivedAt),
    [schools],
  );

  const [hodName, setHodName] = useState(department?.hodName ?? "");
  const [facultyId, setFacultyId] = useState(department?.facultyId ?? "");
  const [schoolId, setSchoolId] = useState(department?.schoolId ?? "");

  const { register, handleSubmit, formState } = useForm<DepartmentFormValues>({
    defaultValues: {
      name: department?.name ?? "",
    },
  });

  const onSubmit = (values: DepartmentFormValues) => {
    if (!hodName || !facultyId || !schoolId) {
      toast.error("Select a H.O.D, faculty, and school");
      return;
    }
    const name = values.name.trim();
    const duplicate = departments.some(
      (d) =>
        d.id !== department?.id &&
        !d.archivedAt &&
        d.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      toast.error(`A department named "${name}" already exists`);
      return;
    }

    const payload = { name, hodName, facultyId, schoolId };

    if (department) {
      updateDepartment(department.id, payload);
      toast.success(`${name} updated`);
      if (authUser?.institutionId) {
        notifyInstitution(
          authUser.institutionId,
          "Department updated",
          `${name}'s record was updated.`,
          "/dashboard/academics/departments",
        );
      }
    } else {
      const created = createDepartment(payload);
      toast.success(`${created.name} added`);
      if (authUser?.institutionId) {
        notifyInstitution(
          authUser.institutionId,
          "New department added",
          `${created.name} was added to your institution's academic structure.`,
          "/dashboard/academics/departments",
        );
      }
    }
    onDone();
  };

  return (
    <>
      <form
        id="department-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 p-6"
      >
        <NotchedField
          label="Department Name"
          labelClassName="bg-popover"
          placeholder="e.g. Mathematics Department"
          {...register("name", { required: true })}
        />
        <NotchedComboboxField
          label="H.O.D"
          labelClassName="bg-popover"
          value={hodName}
          onValueChange={setHodName}
          options={HOD_CANDIDATES.map((name) => ({ label: name, value: name }))}
          placeholder="Select H.O.D"
          searchPlaceholder="Search names…"
          emptyText="No name found."
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
          label="School"
          labelClassName="bg-popover"
          value={schoolId}
          onValueChange={setSchoolId}
          options={activeSchools.map((s) => ({ label: s.name, value: s.id }))}
          placeholder="Select school"
        />
      </form>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="submit"
          form="department-form"
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
