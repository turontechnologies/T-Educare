"use client";

import { useMemo, useState } from "react";
import {
  GraduationCap,
  Mail,
  Phone,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { fullName } from "@/lib/staff-members";
import {
  useDeleteStaffQualification,
  useStaffQualifications,
} from "@/hooks/use-staff-members";
import { useCoursesStore } from "@/store/courses.store";
import { useDepartmentsStore } from "@/store/departments.store";
import { useStaffStore } from "@/store/staff.store";
import type { StaffMember } from "@/types/staff-member";
import { AddQualificationDialog } from "./add-qualification-dialog";

interface StaffDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffMember?: StaffMember;
}

const dateOnlyLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
    .format(new Date(iso))
    .replace(/ /g, "-");

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

export function StaffDetailsDialog({
  open,
  onOpenChange,
  staffMember,
}: StaffDetailsDialogProps) {
  const designations = useStaffStore((state) => state.designations);
  const departments = useDepartmentsStore((state) => state.departments);
  const courses = useCoursesStore((state) => state.courses);

  const [addQualificationOpen, setAddQualificationOpen] = useState(false);
  const { data: qualifications } = useStaffQualifications(staffMember?.id, {
    enabled: open,
  });
  const deleteQualification = useDeleteStaffQualification();

  const designationName = (id: string) =>
    designations.find((d) => d.id === id)?.name ?? "—";
  const departmentName = (id: string) =>
    departments.find((d) => d.id === id)?.name ?? "—";

  const lecturingCourses = useMemo(
    () =>
      staffMember
        ? courses.filter(
            (course) =>
              course.lecturerId === staffMember.id && !course.archivedAt,
          )
        : [],
    [courses, staffMember],
  );

  const handleDeleteQualification = async (qualificationId: string) => {
    if (!staffMember) return;
    try {
      await deleteQualification.mutateAsync({
        staffId: staffMember.id,
        qualificationId,
      });
      toast.success("Qualification removed");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove qualification",
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
              Staff Details
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

          {staffMember && (
            <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border-2 border-secondary bg-muted">
                  {staffMember.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={staffMember.avatarUrl}
                      alt={fullName(staffMember)}
                      className="size-full object-cover"
                    />
                  ) : (
                    <User className="size-8 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {fullName(staffMember)}
                    </h3>
                    <Badge className="bg-secondary/10 text-secondary">
                      {designationName(staffMember.roleId)}
                    </Badge>
                    {staffMember.archivedAt && (
                      <Badge className="bg-muted text-muted-foreground">
                        Archived
                      </Badge>
                    )}
                  </div>
                  <p className="font-mono text-sm text-muted-foreground">
                    {staffMember.staffId}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="size-3.5" />
                      {staffMember.email}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-3.5" />
                      {staffMember.phone}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-foreground">
                  Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-4 rounded-md border border-border bg-muted/40 p-4 text-sm sm:grid-cols-4">
                  <Field label="Gender" value={staffMember.gender} />
                  <Field
                    label="Marital Status"
                    value={staffMember.maritalStatus}
                  />
                  <Field
                    label="Date of Birth"
                    value={dateOnlyLabel(staffMember.dateOfBirth)}
                  />
                  <Field
                    label="Emergency Contact"
                    value={staffMember.emergencyContact}
                  />
                  <div className="col-span-2 sm:col-span-4">
                    <Field
                      label="Contact Address"
                      value={staffMember.contactAddress}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-foreground">
                  Employment
                </h4>
                <div className="grid grid-cols-2 gap-4 rounded-md border border-border bg-muted/40 p-4 text-sm sm:grid-cols-4">
                  <Field
                    label="Role"
                    value={designationName(staffMember.roleId)}
                  />
                  <Field
                    label="Designation"
                    value={designationName(staffMember.designationId)}
                  />
                  <Field
                    label="Department"
                    value={departmentName(staffMember.departmentId)}
                  />
                  <Field
                    label="Employment Start Date"
                    value={dateOnlyLabel(staffMember.employmentStartDate)}
                  />
                  <Field
                    label="Salary"
                    value={
                      staffMember.salaryAmount != null
                        ? `${staffMember.salaryCurrency ?? ""} ${staffMember.salaryAmount.toLocaleString()}`
                        : undefined
                    }
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">
                    Qualifications
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setAddQualificationOpen(true)}
                  >
                    <Plus className="size-3.5" />
                    Add Qualification
                  </Button>
                </div>
                <div className="space-y-2 rounded-md border border-border bg-muted/40 p-4 text-sm">
                  {qualifications && qualifications.length > 0 ? (
                    qualifications.map((qualification) => (
                      <div
                        key={qualification.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
                      >
                        <div className="flex items-start gap-2">
                          <GraduationCap className="mt-0.5 size-4 shrink-0 text-secondary" />
                          <div>
                            <p className="font-medium text-foreground">
                              {qualification.degree} —{" "}
                              {qualification.fieldOfStudy}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {qualification.institutionAttended}
                              {qualification.yearObtained
                                ? ` · ${qualification.yearObtained}`
                                : ""}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${qualification.degree}`}
                          onClick={() =>
                            handleDeleteQualification(qualification.id)
                          }
                          className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="py-2 text-center text-muted-foreground">
                      No qualifications on record yet.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-foreground">
                  Courses Lecturing ({lecturingCourses.length})
                </h4>
                <div className="space-y-2 rounded-md border border-border bg-muted/40 p-4 text-sm">
                  {lecturingCourses.length > 0 ? (
                    lecturingCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
                      >
                        <span className="font-medium text-foreground">
                          {course.name}{" "}
                          <span className="font-mono text-xs text-muted-foreground">
                            ({course.code})
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {course.unit} unit{course.unit === 1 ? "" : "s"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="py-2 text-center text-muted-foreground">
                      Not currently assigned to any course.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AddQualificationDialog
        open={addQualificationOpen}
        onOpenChange={setAddQualificationOpen}
        staffMember={staffMember}
      />
    </>
  );
}
