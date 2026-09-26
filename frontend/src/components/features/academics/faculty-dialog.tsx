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
import { useFacultiesStore } from "@/store/faculties.store";
import { useSchoolsStore } from "@/store/schools.store";
import type { Faculty } from "@/types/faculty";

/**
 * No general "staff directory" exists yet to pick a real person from — this
 * is a small curated candidate list local to this dialog, same convention
 * as School Management's "School Head" field. Revisit once a real
 * staff/person record type exists.
 */
const DEAN_CANDIDATES = [
  "Dr. Solomon Olusegun",
  "Alh. Mustapha George",
  "Prof. Ngozi Eze",
  "Chief Adebayo Fashola",
  "Engr. Chukwuemeka Okafor",
  "Alh. Gbenga Olusegun",
  "Dr. Amina Bello",
];

interface FacultyFormValues {
  name: string;
}

interface FacultyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing faculty. */
  faculty?: Faculty;
}

export function FacultyDialog({
  open,
  onOpenChange,
  faculty,
}: FacultyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {faculty ? "Edit Faculty" : "Add New Faculty"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed so switching between "add" and "edit — faculty X" starts from clean defaults without an effect resetting state. */}
        {open && (
          <FacultyForm
            key={faculty?.id ?? "new"}
            faculty={faculty}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FacultyForm({
  faculty,
  onDone,
}: {
  faculty?: Faculty;
  onDone: () => void;
}) {
  const faculties = useFacultiesStore((state) => state.faculties);
  const createFaculty = useFacultiesStore((state) => state.createFaculty);
  const updateFaculty = useFacultiesStore((state) => state.updateFaculty);
  const schools = useSchoolsStore((state) => state.schools);
  const activeSchools = useMemo(
    () => schools.filter((s) => !s.archivedAt),
    [schools],
  );

  const [deanName, setDeanName] = useState(faculty?.deanName ?? "");
  const [schoolId, setSchoolId] = useState(faculty?.schoolId ?? "");

  const { register, handleSubmit, formState } = useForm<FacultyFormValues>({
    defaultValues: {
      name: faculty?.name ?? "",
    },
  });

  const onSubmit = (values: FacultyFormValues) => {
    if (!deanName || !schoolId) {
      toast.error("Select a dean of faculty and a school");
      return;
    }
    const name = values.name.trim();
    const duplicate = faculties.some(
      (f) =>
        f.id !== faculty?.id &&
        !f.archivedAt &&
        f.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      toast.error(`A faculty named "${name}" already exists`);
      return;
    }

    const payload = { name, deanName, schoolId };

    if (faculty) {
      updateFaculty(faculty.id, payload);
      toast.success(`${name} updated`);
    } else {
      const created = createFaculty(payload);
      toast.success(`${created.name} added`);
    }
    onDone();
  };

  return (
    <>
      <form
        id="faculty-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 p-6"
      >
        <NotchedField
          label="Faculty Name"
          labelClassName="bg-popover"
          placeholder="e.g. Faculty of Law"
          {...register("name", { required: true })}
        />
        <NotchedComboboxField
          label="Dean of Faculty"
          labelClassName="bg-popover"
          value={deanName}
          onValueChange={setDeanName}
          options={DEAN_CANDIDATES.map((name) => ({
            label: name,
            value: name,
          }))}
          placeholder="Select dean of faculty"
          searchPlaceholder="Search names…"
          emptyText="No name found."
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
          form="faculty-form"
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
