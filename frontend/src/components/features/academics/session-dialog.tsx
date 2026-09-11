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
  NotchedDateField,
  NotchedField,
} from "@/components/shared/notched-field";
import { notifyInstitution } from "@/lib/notify";
import { useAcademicsStore } from "@/store/academics.store";
import { useAuthStore } from "@/store/auth.store";
import type { AcademicSession } from "@/types/academics";

interface SessionFormValues {
  session: string;
}

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing session. */
  session?: AcademicSession;
}

export function SessionDialog({
  open,
  onOpenChange,
  session,
}: SessionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {session ? "Edit Session" : "Add New Session"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed so switching between "add" and "edit — session X" starts from clean defaults without an effect resetting state. */}
        {open && (
          <SessionForm
            key={session?.id ?? "new"}
            session={session}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SessionForm({
  session,
  onDone,
}: {
  session?: AcademicSession;
  onDone: () => void;
}) {
  const authUser = useAuthStore((state) => state.user);
  const createSession = useAcademicsStore((state) => state.createSession);
  const updateSession = useAcademicsStore((state) => state.updateSession);

  const [from, setFrom] = useState(
    session?.from ? session.from.slice(0, 10) : "",
  );
  const [to, setTo] = useState(session?.to ? session.to.slice(0, 10) : "");

  const { register, handleSubmit, formState } = useForm<SessionFormValues>({
    defaultValues: { session: session?.session ?? "" },
  });

  const onSubmit = (values: SessionFormValues) => {
    if (!from || !to) {
      toast.error("Set both a start and end date");
      return;
    }

    const payload = {
      session: values.session,
      from: new Date(from).toISOString(),
      to: new Date(to).toISOString(),
    };

    if (session) {
      updateSession(session.id, payload);
      toast.success(`${values.session} updated`);
    } else {
      createSession(payload);
      toast.success(`${values.session} added`);
      if (authUser?.institutionId) {
        notifyInstitution(
          authUser.institutionId,
          "New academic session added",
          `${values.session} was added to your institution's calendar.`,
          "/dashboard/academics/sessions",
        );
      }
    }
    onDone();
  };

  return (
    <>
      <form
        id="session-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 p-6"
      >
        <NotchedField
          label="Session Name"
          labelClassName="bg-popover"
          placeholder="e.g. 2024/2025"
          {...register("session", { required: true })}
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
          form="session-form"
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
