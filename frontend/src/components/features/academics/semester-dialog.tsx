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
  NotchedDateField,
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import { notifyInstitution } from "@/lib/notify";
import { useAcademicsStore } from "@/store/academics.store";
import { useAuthStore } from "@/store/auth.store";
import type { AcademicSemester } from "@/types/academics";

interface SemesterFormValues {
  name: string;
  description: string;
}

interface SemesterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing semester. */
  semester?: AcademicSemester;
}

export function SemesterDialog({
  open,
  onOpenChange,
  semester,
}: SemesterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {semester ? "Edit Semester" : "Add New Semester"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed so switching between "add" and "edit — semester X" starts from clean defaults without an effect resetting state. */}
        {open && (
          <SemesterForm
            key={semester?.id ?? "new"}
            semester={semester}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SemesterForm({
  semester,
  onDone,
}: {
  semester?: AcademicSemester;
  onDone: () => void;
}) {
  const authUser = useAuthStore((state) => state.user);
  const sessions = useAcademicsStore((state) => state.sessions);
  const createSemester = useAcademicsStore((state) => state.createSemester);
  const updateSemester = useAcademicsStore((state) => state.updateSemester);

  const activeSessions = useMemo(
    () => sessions.filter((s) => !s.archivedAt),
    [sessions],
  );

  const [sessionId, setSessionId] = useState(semester?.sessionId ?? "");
  const [from, setFrom] = useState(
    semester?.from ? semester.from.slice(0, 10) : "",
  );
  const [to, setTo] = useState(semester?.to ? semester.to.slice(0, 10) : "");

  const { register, handleSubmit, formState } = useForm<SemesterFormValues>({
    defaultValues: {
      name: semester?.name ?? "",
      description: semester?.description ?? "",
    },
  });

  const onSubmit = (values: SemesterFormValues) => {
    if (!sessionId) {
      toast.error("Select a session");
      return;
    }
    if (!from || !to) {
      toast.error("Set both a start and end date");
      return;
    }

    const payload = {
      sessionId,
      name: values.name,
      description: values.description,
      from: new Date(from).toISOString(),
      to: new Date(to).toISOString(),
    };

    if (semester) {
      updateSemester(semester.id, payload);
      toast.success(`${values.name} updated`);
    } else {
      createSemester(payload);
      toast.success(`${values.name} added`);
      if (authUser?.institutionId) {
        notifyInstitution(
          authUser.institutionId,
          "New semester added",
          `${values.name} was added to your institution's calendar.`,
          "/dashboard/academics/sessions",
        );
      }
    }
    onDone();
  };

  return (
    <>
      <form
        id="semester-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 p-6"
      >
        <NotchedSelectField
          label="Session"
          labelClassName="bg-popover"
          value={sessionId}
          onValueChange={setSessionId}
          options={activeSessions.map((s) => ({
            label: s.session,
            value: s.id,
          }))}
          placeholder={
            activeSessions.length === 0
              ? "Add a session first"
              : "Select session"
          }
        />
        <NotchedField
          label="Semester Name"
          labelClassName="bg-popover"
          placeholder="e.g. First Semester"
          {...register("name", { required: true })}
        />
        <NotchedField
          label="Description"
          labelClassName="bg-popover"
          placeholder="e.g. First semester of the session"
          {...register("description", { required: true })}
        />
        <div className="grid grid-cols-2 gap-4">
          <NotchedDateField
            label="From"
            labelClassName="bg-popover"
            value={from}
            onValueChange={setFrom}
          />
          <NotchedDateField
            label="To"
            labelClassName="bg-popover"
            value={to}
            onValueChange={setTo}
          />
        </div>
      </form>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="submit"
          form="semester-form"
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
