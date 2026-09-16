"use client";

import { Mail, Phone, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { fullName } from "@/lib/lecturers";
import { useFacultiesStore } from "@/store/faculties.store";
import { useSchoolsStore } from "@/store/schools.store";
import type { Lecturer } from "@/types/lecturer";

interface LecturerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lecturer?: Lecturer;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}

export function LecturerDetailsDialog({
  open,
  onOpenChange,
  lecturer,
}: LecturerDetailsDialogProps) {
  const schools = useSchoolsStore((state) => state.schools);
  const faculties = useFacultiesStore((state) => state.faculties);

  const assignmentName = (l: Lecturer) =>
    l.assignmentType === "school"
      ? (schools.find((s) => s.id === l.assignmentId)?.name ?? "—")
      : (faculties.find((f) => f.id === l.assignmentId)?.name ?? "—");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-lg gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Lecturer Details
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer text-white/80 transition-colors hover:text-white"
          >
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {lecturer && (
          <div className="space-y-5 p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border-2 border-secondary bg-muted">
                <User className="size-7 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <h3 className="text-lg font-semibold text-foreground">
                  {fullName(lecturer)}
                </h3>
                <p className="font-mono text-sm text-muted-foreground">
                  {lecturer.username}
                </p>
                <Badge className="bg-secondary/10 text-secondary">
                  {lecturer.position}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-md border border-border bg-muted/40 p-4 text-sm">
              <Field label="Gender" value={lecturer.gender} />
              <Field
                label={
                  lecturer.assignmentType === "school" ? "School" : "Faculty"
                }
                value={assignmentName(lecturer)}
              />
              <div className="col-span-2 flex flex-wrap gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="size-3.5" />
                  {lecturer.email}
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="size-3.5" />
                  {lecturer.phone}
                </span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
