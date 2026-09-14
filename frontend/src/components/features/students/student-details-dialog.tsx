"use client";

import { Mail, Phone, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { fullName } from "@/lib/students";
import { useAcademicsStore } from "@/store/academics.store";
import { useSchoolsStore } from "@/store/schools.store";
import type { Student } from "@/types/student";

interface StudentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student;
}

const RECORD_STATUS_BADGE_CLASS: Record<string, string> = {
  completed: "bg-muted text-muted-foreground",
  current: "bg-emerald-500/10 text-emerald-600",
  repeat: "bg-destructive/10 text-destructive",
};

const dateOnlyLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
    .format(new Date(iso))
    .replace(/ /g, "-");

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}

export function StudentDetailsDialog({
  open,
  onOpenChange,
  student,
}: StudentDetailsDialogProps) {
  const sessions = useAcademicsStore((state) => state.sessions);
  const schools = useSchoolsStore((state) => state.schools);
  const sessionName = (id: string) =>
    sessions.find((s) => s.id === id)?.session ?? "—";
  const schoolName = (id: string) =>
    schools.find((s) => s.id === id)?.name ?? "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-3xl gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Student Details
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

        {student && (
          <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border-2 border-secondary bg-muted">
                {student.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={student.avatarUrl}
                    alt={fullName(student)}
                    className="size-full object-cover"
                  />
                ) : (
                  <User className="size-8 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {student.title}. {fullName(student)}
                  </h3>
                  <Badge
                    className={
                      student.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {student.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                  {student.isGraduating && (
                    <Badge className="bg-secondary/10 text-secondary">
                      Graduating
                    </Badge>
                  )}
                  {student.isDeferred && (
                    <Badge className="bg-muted text-muted-foreground">
                      Deferred
                    </Badge>
                  )}
                  {student.holdForReview && (
                    <Badge className="bg-orange-500/15 text-orange-600">
                      Hold for Review
                    </Badge>
                  )}
                </div>
                <p className="font-mono text-sm text-muted-foreground">
                  {student.matricNo}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    {student.email}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    {student.phone}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">
                Personal Information
              </h4>
              <div className="grid grid-cols-2 gap-4 rounded-md border border-border bg-muted/40 p-4 text-sm sm:grid-cols-4">
                <Field label="Gender" value={student.gender} />
                <Field label="Marital Status" value={student.maritalStatus} />
                <Field
                  label="Date of Birth"
                  value={dateOnlyLabel(student.dateOfBirth)}
                />
                <Field label="Religion" value={student.religion} />
                <Field label="Nationality" value={student.nationality} />
                <Field label="State of Origin" value={student.stateOfOrigin} />
                <Field label="LGA" value={student.lga} />
                <Field
                  label="Emergency Contact"
                  value={student.emergencyContact}
                />
                <div className="col-span-2 sm:col-span-4">
                  <Field
                    label="Resident Address"
                    value={student.residentAddress}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">
                Bio-data
              </h4>
              <div className="grid grid-cols-2 gap-4 rounded-md border border-border bg-muted/40 p-4 text-sm sm:grid-cols-4">
                <Field label="Blood Group" value={student.bloodGroup} />
                <Field label="Genotype" value={student.genotype} />
                <Field label="Weight" value={`${student.weightKg} kg`} />
                <Field label="Height" value={`${student.heightCm} cm`} />
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">
                Academic
              </h4>
              <div className="grid grid-cols-2 gap-4 rounded-md border border-border bg-muted/40 p-4 text-sm sm:grid-cols-3">
                <Field label="School" value={schoolName(student.schoolId)} />
                <Field label="Faculty" value={student.faculty} />
                <Field label="Department" value={student.department} />
                <Field label="Program of Study" value={student.programme} />
                <Field label="Current Level" value={student.currentLevel} />
                <Field
                  label="Current Session"
                  value={sessionName(student.currentSessionId)}
                />
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">
                Academic History
              </h4>
              <p className="mb-3 text-xs text-muted-foreground">
                Append-only — every session&apos;s record is preserved
                permanently, even after a rollover moves this student forward.
              </p>
              <div className="space-y-2">
                {student.academicHistory.map((record, i) => (
                  <div
                    key={`${record.sessionId}-${i}`}
                    className="animate-in fade-in duration-300 rounded-md border border-border p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        {sessionName(record.sessionId)}
                        <span className="text-muted-foreground">·</span>
                        {record.level}
                      </div>
                      <Badge
                        className={cn(
                          "capitalize",
                          RECORD_STATUS_BADGE_CLASS[record.status],
                        )}
                      >
                        {record.status}
                      </Badge>
                    </div>
                    {record.carryoverCourses.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          Carryover:
                        </span>
                        {record.carryoverCourses.map((code) => (
                          <Badge
                            key={code}
                            variant="outline"
                            className="font-mono text-[10px]"
                          >
                            {code}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {record.courseResults.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                        {record.courseResults.map((c) => (
                          <span key={`${c.courseCode}-${c.attempt}`}>
                            {c.courseCode}:{" "}
                            <span
                              className={
                                c.passed
                                  ? "text-emerald-600"
                                  : "text-destructive"
                              }
                            >
                              {c.score} ({c.grade})
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
