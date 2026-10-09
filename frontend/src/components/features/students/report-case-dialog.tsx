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
import { NotchedField } from "@/components/shared/notched-field";
import { useReportCase } from "@/hooks/use-students";
import type { Student } from "@/types/student";

interface ReportCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
}

export function ReportCaseDialog({
  open,
  onOpenChange,
  student,
}: ReportCaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Report a Case
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {open && student && (
          <ReportCaseForm
            key={student.id}
            student={student}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReportCaseForm({
  student,
  onDone,
}: {
  student: Student;
  onDone: () => void;
}) {
  const reportCase = useReportCase();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Enter both a title and a description");
      return;
    }

    try {
      await reportCase.mutateAsync({
        studentId: student.id,
        payload: { title: title.trim(), description: description.trim() },
      });
      toast.success("Case reported");
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to report case",
      );
    }
  };

  return (
    <>
      <div className="space-y-5 p-6">
        <NotchedField
          label="Title"
          labelClassName="bg-popover"
          placeholder="e.g. Noise complaint"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <NotchedField
          label="Description"
          labelClassName="bg-popover"
          placeholder="What happened?"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          disabled={reportCase.isPending}
          onClick={handleSubmit}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Report
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
