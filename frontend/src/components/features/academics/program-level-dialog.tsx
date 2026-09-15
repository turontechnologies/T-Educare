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
import { notifyInstitution } from "@/lib/notify";
import { useAuthStore } from "@/store/auth.store";
import { useProgramLevelsStore } from "@/store/program-levels.store";
import type { ProgramLevel } from "@/types/program-level";

interface ProgramLevelFormValues {
  levelCode: string;
  description: string;
}

interface ProgramLevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing program level. */
  programLevel?: ProgramLevel;
}

export function ProgramLevelDialog({
  open,
  onOpenChange,
  programLevel,
}: ProgramLevelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {programLevel ? "Edit Program Level" : "Add New Program Level"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed so switching between "add" and "edit — level X" starts from clean defaults without an effect resetting state. */}
        {open && (
          <ProgramLevelForm
            key={programLevel?.id ?? "new"}
            programLevel={programLevel}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProgramLevelForm({
  programLevel,
  onDone,
}: {
  programLevel?: ProgramLevel;
  onDone: () => void;
}) {
  const authUser = useAuthStore((state) => state.user);
  const programLevels = useProgramLevelsStore((state) => state.programLevels);
  const createProgramLevel = useProgramLevelsStore(
    (state) => state.createProgramLevel,
  );
  const updateProgramLevel = useProgramLevelsStore(
    (state) => state.updateProgramLevel,
  );

  const { register, handleSubmit, formState } = useForm<ProgramLevelFormValues>(
    {
      defaultValues: {
        levelCode: programLevel?.levelCode ?? "",
        description: programLevel?.description ?? "",
      },
    },
  );

  const onSubmit = (values: ProgramLevelFormValues) => {
    const levelCode = values.levelCode.trim();
    const duplicate = programLevels.some(
      (p) =>
        p.id !== programLevel?.id &&
        !p.archivedAt &&
        p.levelCode.toLowerCase() === levelCode.toLowerCase(),
    );
    if (duplicate) {
      toast.error(`Level code "${levelCode}" already exists`);
      return;
    }

    const payload = { levelCode, description: values.description.trim() };

    if (programLevel) {
      updateProgramLevel(programLevel.id, payload);
      toast.success(`${levelCode} updated`);
      if (authUser?.institutionId) {
        notifyInstitution(
          authUser.institutionId,
          "Program level updated",
          `Level ${levelCode} was updated.`,
          "/dashboard/academics/program-levels",
        );
      }
    } else {
      const created = createProgramLevel(payload);
      toast.success(`${created.levelCode} added`);
      if (authUser?.institutionId) {
        notifyInstitution(
          authUser.institutionId,
          "New program level added",
          `Level ${created.levelCode} was added to your institution's academic structure.`,
          "/dashboard/academics/program-levels",
        );
      }
    }
    onDone();
  };

  return (
    <>
      <form
        id="program-level-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 p-6"
      >
        <NotchedField
          label="Level Code"
          labelClassName="bg-popover"
          placeholder="e.g. 100"
          {...register("levelCode", { required: true })}
        />
        <NotchedField
          label="Description"
          labelClassName="bg-popover"
          placeholder="e.g. 100 levels"
          {...register("description", { required: true })}
        />
      </form>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="submit"
          form="program-level-form"
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
