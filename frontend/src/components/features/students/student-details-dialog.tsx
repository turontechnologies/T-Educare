"use client";

import { useState } from "react";
import { Mail, Phone, ShieldAlert, User, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  DISCIPLINARY_STATUS_BADGE,
  fullName,
  primaryPreStudentIdentifier,
} from "@/lib/students";
import { useStudentIdentitySettingsStore } from "@/store/student-identity-settings.store";
import {
  useResolveCase,
  useStudentAcademicHistory,
  useStudentCases,
  useStudentDisciplinaryRecords,
} from "@/hooks/use-students";
import { useAcademicsStore } from "@/store/academics.store";
import { useCoursesStore } from "@/store/courses.store";
import { useDepartmentsStore } from "@/store/departments.store";
import { useFacultiesStore } from "@/store/faculties.store";
import { useProgramLevelsStore } from "@/store/program-levels.store";
import { useProgramsStore } from "@/store/programs.store";
import { useSchoolsStore } from "@/store/schools.store";
import type { Student } from "@/types/student";
import { RecordDisciplinaryActionDialog } from "./record-disciplinary-action-dialog";
import { ReportCaseDialog } from "./report-case-dialog";

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

const DISCIPLINARY_BADGE_CLASS: Record<string, string> = {
  SUSPENSION: "bg-amber-500/10 text-amber-600",
  RUSTICATION: "bg-red-500/10 text-red-600",
  EXPULSION: "bg-destructive/10 text-destructive",
  WARNING: "bg-orange-500/15 text-orange-600",
  REINSTATEMENT: "bg-emerald-500/10 text-emerald-600",
};

const CASE_STATUS_BADGE_CLASS: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-600",
  resolved: "bg-emerald-500/10 text-emerald-600",
  dismissed: "bg-muted text-muted-foreground",
};

const dateOnlyLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
    .format(new Date(iso))
    .replace(/ /g, "-");

const dateTimeLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value || "—"}</p>
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
  const faculties = useFacultiesStore((state) => state.faculties);
  const departments = useDepartmentsStore((state) => state.departments);
  const programs = useProgramsStore((state) => state.programs);
  const programLevels = useProgramLevelsStore((state) => state.programLevels);
  const courses = useCoursesStore((state) => state.courses);
  const identityPreference = useStudentIdentitySettingsStore(
    (state) => state.settings.preStudentIdentifierPreference,
  );

  const [disciplinaryDialogOpen, setDisciplinaryDialogOpen] = useState(false);
  const [reportCaseDialogOpen, setReportCaseDialogOpen] = useState(false);
  const resolveCase = useResolveCase();

  const { data: academicHistory } = useStudentAcademicHistory(student?.id, {
    enabled: open,
  });
  const { data: disciplinaryRecords } = useStudentDisciplinaryRecords(
    student?.id,
    { enabled: open },
  );
  const { data: cases } = useStudentCases(student?.id, { enabled: open });

  const sessionName = (id: string) =>
    sessions.find((s) => s.id === id)?.session ?? "—";
  const schoolName = (id: string) =>
    schools.find((s) => s.id === id)?.name ?? "—";
  const facultyName = (id: string) =>
    faculties.find((f) => f.id === id)?.name ?? "—";
  const departmentName = (id: string) =>
    departments.find((d) => d.id === id)?.name ?? "—";
  const programName = (id: string) =>
    programs.find((p) => p.id === id)?.name ?? "—";
  const levelName = (id: string) =>
    programLevels.find((l) => l.id === id)?.levelCode ?? "—";
  const courseCode = (id: string) =>
    courses.find((c) => c.id === id)?.code ?? id;

  const handleResolve = async (
    caseId: string,
    status: "resolved" | "dismissed",
  ) => {
    if (!student) return;
    try {
      await resolveCase.mutateAsync({
        studentId: student.id,
        caseId,
        payload: { status },
      });
      toast.success(`Case marked ${status}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update case",
      );
    }
  };

  return (
    <>
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
                    {!student.matricNo && (
                      <Badge className="bg-secondary/10 text-secondary">
                        Pre-Student
                      </Badge>
                    )}
                    {student.admissionMode === "DIRECT_ENTRY" && (
                      <Badge className="bg-purple-500/10 text-purple-600">
                        Direct Entry
                      </Badge>
                    )}
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
                    <StatusBadge
                      status={student.disciplinaryStatus}
                      map={DISCIPLINARY_STATUS_BADGE}
                    />
                  </div>
                  <p className="font-mono text-sm text-muted-foreground">
                    {student.matricNo ??
                      `No matric number assigned yet — ${
                        identityPreference === "JAMB_REG_NUMBER" &&
                        student.jambRegNumber
                          ? "JAMB"
                          : "Pre-ID"
                      }: ${primaryPreStudentIdentifier(student, identityPreference)}`}
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
                <div className="flex shrink-0 flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setDisciplinaryDialogOpen(true)}
                  >
                    <ShieldAlert className="size-3.5" />
                    Record Action
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setReportCaseDialogOpen(true)}
                  >
                    Report Case
                  </Button>
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
                  <Field
                    label="State of Origin"
                    value={student.stateOfOrigin}
                  />
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
                  <Field
                    label="Faculty"
                    value={facultyName(student.facultyId)}
                  />
                  <Field
                    label="Department"
                    value={departmentName(student.departmentId)}
                  />
                  <Field
                    label="Program of Study"
                    value={programName(student.programId)}
                  />
                  <Field
                    label="Current Level"
                    value={levelName(student.programLevelId)}
                  />
                  <Field
                    label="Current Session"
                    value={sessionName(student.currentSessionId)}
                  />
                  <Field
                    label="Admission Mode"
                    value={
                      student.admissionMode === "DIRECT_ENTRY"
                        ? "Direct Entry"
                        : "UTME"
                    }
                  />
                  <Field
                    label="JAMB Reg. Number"
                    value={student.jambRegNumber}
                  />
                </div>
              </div>

              {(student.hostelName || student.roomNumber) && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground">
                    Hostel
                  </h4>
                  <div className="grid grid-cols-2 gap-4 rounded-md border border-border bg-muted/40 p-4 text-sm">
                    <Field label="Hostel" value={student.hostelName} />
                    <Field label="Room Number" value={student.roomNumber} />
                  </div>
                </div>
              )}

              <div>
                <h4 className="mb-2 text-sm font-medium text-foreground">
                  Medical History
                </h4>
                <div className="grid grid-cols-2 gap-4 rounded-md border border-border bg-muted/40 p-4 text-sm sm:grid-cols-3">
                  <Field label="Allergies" value={student.allergies} />
                  <Field
                    label="Chronic Conditions"
                    value={student.chronicConditions}
                  />
                  <Field
                    label="Current Medications"
                    value={student.currentMedications}
                  />
                  <Field label="Past Surgeries" value={student.pastSurgeries} />
                  <Field label="Physician" value={student.physicianName} />
                  <Field
                    label="Physician Phone"
                    value={student.physicianPhone}
                  />
                  <Field
                    label="Health Insurance Provider"
                    value={student.healthInsuranceProvider}
                  />
                  <Field
                    label="Health Insurance Number"
                    value={student.healthInsuranceNumber}
                  />
                  <div className="col-span-2 sm:col-span-3">
                    <Field label="Notes" value={student.medicalNotes} />
                  </div>
                </div>
              </div>

              {disciplinaryRecords && disciplinaryRecords.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground">
                    Disciplinary History
                  </h4>
                  <div className="space-y-2">
                    {disciplinaryRecords.map((record) => (
                      <div
                        key={record.id}
                        className="rounded-md border border-border p-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge
                            className={cn(
                              "border-0",
                              DISCIPLINARY_BADGE_CLASS[record.actionType],
                            )}
                          >
                            {record.actionType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {dateTimeLabel(record.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-foreground">
                          {record.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cases && cases.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground">
                    Reported Cases
                  </h4>
                  <div className="space-y-2">
                    {cases.map((caseRecord) => (
                      <div
                        key={caseRecord.id}
                        className="rounded-md border border-border p-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-foreground">
                            {caseRecord.title}
                          </span>
                          <Badge
                            className={cn(
                              "border-0",
                              CASE_STATUS_BADGE_CLASS[caseRecord.status],
                            )}
                          >
                            {caseRecord.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-muted-foreground">
                          {caseRecord.description}
                        </p>
                        {caseRecord.resolutionNotes && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Resolution: {caseRecord.resolutionNotes}
                          </p>
                        )}
                        {caseRecord.status === "open" && (
                          <div className="mt-2 flex gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleResolve(caseRecord.id, "resolved")
                              }
                              className="cursor-pointer text-xs font-medium text-secondary hover:underline"
                            >
                              Mark Resolved
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleResolve(caseRecord.id, "dismissed")
                              }
                              className="cursor-pointer text-xs font-medium text-muted-foreground hover:underline"
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="mb-2 text-sm font-medium text-foreground">
                  Academic History
                </h4>
                <p className="mb-3 text-xs text-muted-foreground">
                  Append-only — every session&apos;s record is preserved
                  permanently, even after a rollover moves this student forward.
                </p>
                <div className="space-y-2">
                  {(academicHistory ?? []).map((record) => (
                    <div
                      key={record.id}
                      className="animate-in fade-in duration-300 rounded-md border border-border p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          {sessionName(record.academicSessionId)}
                          <span className="text-muted-foreground">·</span>
                          {levelName(record.programLevelId)}
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
                      {record.carryoverCourseIds.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">
                            Carryover:
                          </span>
                          {record.carryoverCourseIds.map((id) => (
                            <Badge
                              key={id}
                              variant="outline"
                              className="font-mono text-[10px]"
                            >
                              {courseCode(id)}
                            </Badge>
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

      <RecordDisciplinaryActionDialog
        open={disciplinaryDialogOpen}
        onOpenChange={setDisciplinaryDialogOpen}
        student={student ?? null}
      />
      <ReportCaseDialog
        open={reportCaseDialogOpen}
        onOpenChange={setReportCaseDialogOpen}
        student={student ?? null}
      />
    </>
  );
}
