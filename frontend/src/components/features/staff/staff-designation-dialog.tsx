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
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import { notifyInstitution } from "@/lib/notify";
import { useAuthStore } from "@/store/auth.store";
import { useStaffStore } from "@/store/staff.store";
import type {
  StaffCategory,
  StaffDesignation,
} from "@/types/staff-designation";

const CATEGORY_OPTIONS: { label: string; value: StaffCategory }[] = [
  { label: "Academic Staff", value: "Academic Staff" },
  { label: "Non-Academic Staff", value: "Non-Academic Staff" },
];

interface DesignationFormValues {
  name: string;
  description: string;
}

interface StaffDesignationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing designation. */
  designation?: StaffDesignation;
}

export function StaffDesignationDialog({
  open,
  onOpenChange,
  designation,
}: StaffDesignationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {designation ? "Edit Designation" : "Add New Designation"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed so switching between "add" and "edit — designation X" starts from clean defaults without an effect resetting state. */}
        {open && (
          <DesignationForm
            key={designation?.id ?? "new"}
            designation={designation}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DesignationForm({
  designation,
  onDone,
}: {
  designation?: StaffDesignation;
  onDone: () => void;
}) {
  const authUser = useAuthStore((state) => state.user);
  const designations = useStaffStore((state) => state.designations);
  const createDesignation = useStaffStore((state) => state.createDesignation);
  const updateDesignation = useStaffStore((state) => state.updateDesignation);

  const [category, setCategory] = useState<StaffCategory | "">(
    designation?.category ?? "",
  );

  const { register, handleSubmit, formState } = useForm<DesignationFormValues>({
    defaultValues: {
      name: designation?.name ?? "",
      description: designation?.description ?? "",
    },
  });

  const onSubmit = (values: DesignationFormValues) => {
    if (!category) {
      toast.error("Select a designation category");
      return;
    }
    const name = values.name.trim();
    const duplicate = designations.some(
      (d) =>
        d.id !== designation?.id &&
        !d.archivedAt &&
        d.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      toast.error(`A designation named "${name}" already exists`);
      return;
    }

    const payload = { name, description: values.description.trim(), category };

    if (designation) {
      updateDesignation(designation.id, payload);
      toast.success(`${name} updated`);
      if (authUser?.institutionId) {
        notifyInstitution(
          authUser.institutionId,
          "Designation updated",
          `${name}'s record was updated.`,
          "/dashboard/staff/designation",
        );
      }
    } else {
      const created = createDesignation(payload);
      toast.success(`${created.name} added`);
      if (authUser?.institutionId) {
        notifyInstitution(
          authUser.institutionId,
          "New designation added",
          `${created.name} was added to your institution's staff designations.`,
          "/dashboard/staff/designation",
        );
      }
    }
    onDone();
  };

  return (
    <>
      <form
        id="designation-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 p-6"
      >
        <NotchedField
          label="Designation"
          labelClassName="bg-popover"
          placeholder="e.g. Registrar"
          {...register("name", { required: true })}
        />
        <NotchedField
          label="Description"
          labelClassName="bg-popover"
          placeholder="e.g. Registrar"
          {...register("description", { required: true })}
        />
        <NotchedSelectField
          label="Designation Category"
          labelClassName="bg-popover"
          value={category}
          onValueChange={(value) => setCategory(value as StaffCategory)}
          options={CATEGORY_OPTIONS}
          placeholder="Select category"
        />
      </form>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="submit"
          form="designation-form"
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
