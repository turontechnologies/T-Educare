"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useUnpublishCourseResult } from "@/hooks/use-course-results";

interface UnpublishDialogProps {
  courseId?: string;
  academicSemesterId?: string;
  courseLabel?: string;
  onOpenChange: (open: boolean) => void;
}

export function UnpublishDialog({
  courseId,
  academicSemesterId,
  courseLabel,
  onOpenChange,
}: UnpublishDialogProps) {
  const open = !!courseId && !!academicSemesterId;
  const unpublish = useUnpublishCourseResult();
  const [reason, setReason] = useState("");

  const handleConfirm = async () => {
    if (!reason.trim()) {
      toast.error("A reason is required");
      return;
    }
    try {
      await unpublish.mutateAsync({
        courseId: courseId!,
        academicSemesterId: academicSemesterId!,
        reason: reason.trim(),
      });
      toast.success(`${courseLabel ?? "Course"} unpublished`);
      setReason("");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unpublish",
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason("");
        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Unpublish {courseLabel}?
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <div className="space-y-3 p-6">
          <p className="text-sm text-muted-foreground">
            Students will no longer see this course&apos;s results. A reason is
            required for the record.
          </p>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Error in recording CA scores"
            rows={3}
          />
        </div>

        <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
          <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Cancel
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={unpublish.isPending}
            onClick={handleConfirm}
            className="rounded-full px-6"
          >
            Unpublish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
