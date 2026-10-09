"use client";

import { useState } from "react";
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
import { useRecordDisciplinaryAction } from "@/hooks/use-students";
import {
  DISCIPLINARY_ACTION_TYPES,
  type DisciplinaryActionType,
  type Student,
} from "@/types/student";

const ACTION_OPTIONS: { label: string; value: DisciplinaryActionType }[] = [
  { label: "Suspension", value: "SUSPENSION" },
  { label: "Expulsion", value: "EXPULSION" },
  { label: "Warning", value: "WARNING" },
  {
    label: "Reinstatement (lift suspension/expulsion)",
    value: "REINSTATEMENT",
  },
];

interface RecordDisciplinaryActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
}

export function RecordDisciplinaryActionDialog({
  open,
  onOpenChange,
  student,
}: RecordDisciplinaryActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Record Disciplinary Action
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {open && student && (
          <RecordDisciplinaryActionForm
            key={student.id}
            student={student}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RecordDisciplinaryActionForm({
  student,
  onDone,
}: {
  student: Student;
  onDone: () => void;
}) {
  const recordAction = useRecordDisciplinaryAction();
  const [actionType, setActionType] = useState<DisciplinaryActionType | "">("");
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!actionType) {
      toast.error("Select an action type");
      return;
    }
    if (!reason.trim()) {
      toast.error("Enter a reason");
      return;
    }
    if (!DISCIPLINARY_ACTION_TYPES.includes(actionType)) {
      toast.error("Invalid action type");
      return;
    }

    try {
      await recordAction.mutateAsync({
        studentId: student.id,
        payload: { actionType, reason: reason.trim() },
      });
      toast.success(`${actionType.toLowerCase()} recorded for this student`);
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to record action",
      );
    }
  };

  return (
    <>
      <div className="space-y-5 p-6">
        <NotchedSelectField
          label="Action"
          labelClassName="bg-popover"
          value={actionType}
          onValueChange={(value) =>
            setActionType(value as DisciplinaryActionType)
          }
          options={ACTION_OPTIONS}
          placeholder="Select an action"
        />
        <NotchedField
          label="Reason"
          labelClassName="bg-popover"
          placeholder="e.g. Exam malpractice"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          variant={
            actionType === "SUSPENSION" || actionType === "EXPULSION"
              ? "destructive"
              : "default"
          }
          disabled={recordAction.isPending}
          onClick={handleSubmit}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Record
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
