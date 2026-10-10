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
import { useAddStaffQualification } from "@/hooks/use-staff-members";
import type { StaffMember } from "@/types/staff-member";

interface AddQualificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffMember?: StaffMember;
}

export function AddQualificationDialog({
  open,
  onOpenChange,
  staffMember,
}: AddQualificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Add Qualification
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {open && staffMember && (
          <AddQualificationForm
            key={staffMember.id}
            staffMember={staffMember}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddQualificationForm({
  staffMember,
  onDone,
}: {
  staffMember: StaffMember;
  onDone: () => void;
}) {
  const addQualification = useAddStaffQualification();
  const [degree, setDegree] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [institutionAttended, setInstitutionAttended] = useState("");
  const [yearObtained, setYearObtained] = useState("");

  const handleSubmit = async () => {
    if (!degree.trim() || !fieldOfStudy.trim() || !institutionAttended.trim()) {
      toast.error("Fill in degree, field of study, and institution attended");
      return;
    }
    if (yearObtained && Number.isNaN(Number(yearObtained))) {
      toast.error("Year obtained must be a number");
      return;
    }

    try {
      await addQualification.mutateAsync({
        staffId: staffMember.id,
        payload: {
          degree: degree.trim(),
          fieldOfStudy: fieldOfStudy.trim(),
          institutionAttended: institutionAttended.trim(),
          yearObtained: yearObtained ? Number(yearObtained) : undefined,
        },
      });
      toast.success("Qualification added");
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add qualification",
      );
    }
  };

  return (
    <>
      <div className="space-y-5 p-6">
        <NotchedField
          label="Degree"
          labelClassName="bg-popover"
          placeholder="e.g. B.Sc."
          value={degree}
          onChange={(event) => setDegree(event.target.value)}
        />
        <NotchedField
          label="Field of Study"
          labelClassName="bg-popover"
          placeholder="e.g. Computer Science"
          value={fieldOfStudy}
          onChange={(event) => setFieldOfStudy(event.target.value)}
        />
        <NotchedField
          label="Institution Attended"
          labelClassName="bg-popover"
          placeholder="e.g. University of Lagos"
          value={institutionAttended}
          onChange={(event) => setInstitutionAttended(event.target.value)}
        />
        <NotchedField
          label="Year Obtained (optional)"
          labelClassName="bg-popover"
          type="number"
          placeholder="e.g. 2014"
          value={yearObtained}
          onChange={(event) => setYearObtained(event.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          disabled={addQualification.isPending}
          onClick={handleSubmit}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Add
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
