"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  NotchedComboboxField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import { PageHeader } from "@/components/shared/page-header";
import { RegistrationSettingsDialog } from "@/components/features/registration/registration-settings-dialog";
import { fullName } from "@/lib/students";
import { cn } from "@/lib/utils";
import {
  useCourseRegistrations,
  useRegistrationSettings,
  useReplaceCourseRegistrations,
} from "@/hooks/use-registration";
import { useStudentAcademicHistory } from "@/hooks/use-students";
import { useAcademicsStore } from "@/store/academics.store";
import { useCoursesStore } from "@/store/courses.store";
import { useDepartmentsStore } from "@/store/departments.store";
import { useProgramLevelsStore } from "@/store/program-levels.store";
import { useStudentsStore } from "@/store/students.store";

export default function RegistrationPage() {
  const students = useStudentsStore((state) => state.students);
  const semesters = useAcademicsStore((state) => state.semesters);
  const departments = useDepartmentsStore((state) => state.departments);
  const programLevels = useProgramLevelsStore((state) => state.programLevels);
  const courses = useCoursesStore((state) => state.courses);

  const [studentId, setStudentId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(
    new Set(),
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  const student = students.find((s) => s.id === studentId && !s.archivedAt);
  const departmentName = (id?: string) =>
    departments.find((d) => d.id === id)?.name ?? "—";
  const levelName = (id?: string) =>
    programLevels.find((l) => l.id === id)?.levelCode ?? "—";

  const { data: settings } = useRegistrationSettings();
  const { data: academicHistory } = useStudentAcademicHistory(studentId, {
    enabled: !!studentId,
  });
  const { data: existingRegistrations } = useCourseRegistrations(
    studentId || undefined,
    semesterId || undefined,
    { enabled: !!studentId && !!semesterId },
  );
  const replaceRegistrations = useReplaceCourseRegistrations();

  const outstandingCarryoverIds = useMemo(() => {
    const latest = academicHistory?.[0];
    return new Set(latest?.carryoverCourseIds ?? []);
  }, [academicHistory]);

  const eligibleCourses = useMemo(() => {
    if (!student) return [];
    return courses.filter(
      (c) =>
        !c.archivedAt &&
        c.departmentId === student.departmentId &&
        c.programLevelId === student.programLevelId,
    );
  }, [courses, student]);

  const carryoverCourses = useMemo(
    () => courses.filter((c) => outstandingCarryoverIds.has(c.id)),
    [courses, outstandingCarryoverIds],
  );

  // Reset the selection whenever the student/semester changes, seeding it
  // from whatever is already registered for that pairing.
  const selectionKey = `${studentId}:${semesterId}`;
  const [lastSelectionKey, setLastSelectionKey] = useState(selectionKey);
  if (selectionKey !== lastSelectionKey) {
    setLastSelectionKey(selectionKey);
    setSelectedCourseIds(
      new Set((existingRegistrations ?? []).map((r) => r.courseId)),
    );
  }

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  const allSelectedCourses = [...carryoverCourses, ...eligibleCourses].filter(
    (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i,
  );
  const totalUnits = allSelectedCourses
    .filter((c) => selectedCourseIds.has(c.id))
    .reduce((sum, c) => sum + c.unit, 0);
  const maxUnits = settings?.maxUnitsPerSemester ?? 24;
  const overCap = totalUnits > maxUnits;

  const missingCarryovers = settings?.requireCarryoverClearance
    ? carryoverCourses.filter((c) => !selectedCourseIds.has(c.id))
    : [];

  const handleSubmit = async () => {
    if (!studentId || !semesterId) {
      toast.error("Select a student and a semester");
      return;
    }
    if (selectedCourseIds.size === 0) {
      toast.error("Select at least one course");
      return;
    }

    try {
      await replaceRegistrations.mutateAsync({
        studentId,
        academicSemesterId: semesterId,
        courseIds: [...selectedCourseIds],
      });
      toast.success(
        `Registered ${selectedCourseIds.size} course(s) for ${student ? fullName(student) : "student"}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to register courses",
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Registration"]} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-primary">
            Course Registration
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register a student for their semester&apos;s courses — outstanding
            carryovers and the institution&apos;s unit cap are enforced
            automatically.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-1.5 rounded-md"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="size-4" />
          Registration Settings
        </Button>
      </div>

      <RegistrationSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
          <NotchedComboboxField
            label="Student"
            labelClassName="bg-card"
            value={studentId}
            onValueChange={setStudentId}
            options={students
              .filter((s) => !s.archivedAt)
              .map((s) => ({
                label: `${fullName(s)}${s.matricNo ? ` (${s.matricNo})` : " (pre-student)"}`,
                value: s.id,
              }))}
            placeholder="Select a student"
            searchPlaceholder="Search by name or matric no…"
            emptyText="No student found."
          />
          <NotchedSelectField
            label="Academic Semester"
            labelClassName="bg-card"
            value={semesterId}
            onValueChange={setSemesterId}
            options={semesters
              .filter((s) => !s.archivedAt)
              .map((s) => ({ label: s.name, value: s.id }))}
            placeholder="Select a semester"
          />
        </CardContent>
      </Card>

      {student && (
        <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {fullName(student)}
                {student.matricNo ? ` — ${student.matricNo}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {departmentName(student.departmentId)} ·{" "}
                {levelName(student.programLevelId)}
              </p>
            </div>
            <Badge
              className={cn(
                "border-0",
                overCap
                  ? "bg-destructive/10 text-destructive"
                  : "bg-emerald-500/10 text-emerald-600",
              )}
            >
              {totalUnits} / {maxUnits} units
            </Badge>
          </CardHeader>
          <CardContent className="space-y-5 p-6 pt-0">
            {missingCarryovers.length > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p>
                  This student must register for their outstanding carryover
                  course(s) before new courses will be accepted:{" "}
                  <span className="font-medium">
                    {missingCarryovers.map((c) => c.code).join(", ")}
                  </span>
                </p>
              </div>
            )}

            {carryoverCourses.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-secondary uppercase">
                  Outstanding Carryover Courses
                </p>
                <div className="space-y-2">
                  {carryoverCourses.map((course) => (
                    <label
                      key={course.id}
                      className="flex cursor-pointer items-center justify-between rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm"
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedCourseIds.has(course.id)}
                          onChange={() => toggleCourse(course.id)}
                          className="size-4 accent-amber-600"
                        />
                        <span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {course.code}
                          </span>{" "}
                          <span className="font-medium text-foreground">
                            {course.name}
                          </span>
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {course.unit} unit(s)
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-secondary uppercase">
                {levelName(student.programLevelId)} Courses —{" "}
                {departmentName(student.departmentId)}
              </p>
              {eligibleCourses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No courses have been set up yet for this department/level.
                </p>
              ) : (
                <div className="space-y-2">
                  {eligibleCourses.map((course) => (
                    <label
                      key={course.id}
                      className="flex cursor-pointer items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-muted/50"
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedCourseIds.has(course.id)}
                          onChange={() => toggleCourse(course.id)}
                          className="size-4 accent-primary"
                        />
                        <span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {course.code}
                          </span>{" "}
                          <span className="font-medium text-foreground">
                            {course.name}
                          </span>
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {course.unit} unit(s)
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                {selectedCourseIds.size} course(s) selected
              </p>
              <Button
                type="button"
                disabled={
                  replaceRegistrations.isPending || !semesterId || overCap
                }
                onClick={handleSubmit}
                className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                {existingRegistrations && existingRegistrations.length > 0 ? (
                  <>
                    <CheckCircle2 className="size-4" />
                    Update Registration
                  </>
                ) : (
                  <>
                    Register Courses
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
