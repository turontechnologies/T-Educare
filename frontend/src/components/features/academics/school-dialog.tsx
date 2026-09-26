"use client";

import { useState } from "react";
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
import { useSchoolsStore } from "@/store/schools.store";
import { useStaffStore } from "@/store/staff.store";
import type { School } from "@/types/school";

/**
 * No general "staff directory" exists yet to pick a real person from — this
 * is a small curated candidate list local to this dialog, not a stand-in for
 * one. Revisit once a real staff/person record type exists.
 */
const SCHOOL_HEAD_CANDIDATES = [
  "Dr. Solomon Olusegun",
  "Alh. Mustapha George",
  "Prof. Ngozi Eze",
  "Chief Adebayo Fashola",
  "Engr. Chukwuemeka Okafor",
  "Alh. Gbenga Olusegun",
  "Dr. Amina Bello",
];

interface SchoolFormValues {
  name: string;
}

interface SchoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing school. */
  school?: School;
}

export function SchoolDialog({
  open,
  onOpenChange,
  school,
}: SchoolDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {school ? "Edit School" : "Add New School"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed so switching between "add" and "edit — school X" starts from clean defaults without an effect resetting state. */}
        {open && (
          <SchoolForm
            key={school?.id ?? "new"}
            school={school}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SchoolForm({
  school,
  onDone,
}: {
  school?: School;
  onDone: () => void;
}) {
  const schools = useSchoolsStore((state) => state.schools);
  const createSchool = useSchoolsStore((state) => state.createSchool);
  const updateSchool = useSchoolsStore((state) => state.updateSchool);
  const designations = useStaffStore((state) => state.designations);

  const [headName, setHeadName] = useState(school?.headName ?? "");
  const [designation, setDesignation] = useState(school?.designation ?? "");

  const { register, handleSubmit, formState } = useForm<SchoolFormValues>({
    defaultValues: {
      name: school?.name ?? "",
    },
  });

  const onSubmit = (values: SchoolFormValues) => {
    if (!headName || !designation) {
      toast.error("Select a school head and designation");
      return;
    }
    const name = values.name.trim();
    const duplicate = schools.some(
      (s) =>
        s.id !== school?.id &&
        !s.archivedAt &&
        s.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      toast.error(`A school named "${name}" already exists`);
      return;
    }

    const payload = { name, headName, designation };

    if (school) {
      updateSchool(school.id, payload);
      toast.success(`${name} updated`);
    } else {
      const created = createSchool(payload);
      toast.success(`${created.name} added`);
    }
    onDone();
  };

  return (
    <>
      <form
        id="school-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 p-6"
      >
        <NotchedField
          label="School Name"
          labelClassName="bg-popover"
          placeholder="e.g. Lagos State University"
          {...register("name", { required: true })}
        />
        <NotchedComboboxField
          label="School Head"
          labelClassName="bg-popover"
          value={headName}
          onValueChange={setHeadName}
          options={SCHOOL_HEAD_CANDIDATES.map((name) => ({
            label: name,
            value: name,
          }))}
          placeholder="Select school head"
          searchPlaceholder="Search names…"
          emptyText="No name found."
        />
        <NotchedSelectField
          label="Designation"
          labelClassName="bg-popover"
          value={designation}
          onValueChange={setDesignation}
          options={designations.map((d) => ({ label: d.name, value: d.name }))}
          placeholder="Select designation"
        />
      </form>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="submit"
          form="school-form"
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
