"use client";

import { useState } from "react";
import { Share2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import { Switch } from "@/components/ui/switch";
import {
  useAddCourseOffering,
  useCourseOfferings,
  useRemoveCourseOffering,
} from "@/hooks/use-courses";
import { useDepartmentsStore } from "@/store/departments.store";
import type { Course } from "@/types/course";

interface CourseOfferingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course;
}

/** Manage which other departments may "borrow" this course — see CourseDepartmentOffering (API_CONTRACT.md §7.10). */
export function CourseOfferingsDialog({
  open,
  onOpenChange,
  course,
}: CourseOfferingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-lg gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Manage Borrowing — {course?.code}
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

        {open && course && (
          <CourseOfferingsContent key={course.id} course={course} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CourseOfferingsContent({ course }: { course: Course }) {
  const departments = useDepartmentsStore((state) => state.departments);
  const { data: offerings } = useCourseOfferings(course.id);
  const addOffering = useAddCourseOffering();
  const removeOffering = useRemoveCourseOffering();

  const [departmentId, setDepartmentId] = useState("");
  const [unitOverride, setUnitOverride] = useState("");
  const [compulsory, setCompulsory] = useState(true);

  const alreadyBorrowing = new Set([
    course.departmentId,
    ...(offerings ?? []).map((o) => o.departmentId),
  ]);
  const borrowableDepartments = departments.filter(
    (d) => !d.archivedAt && !alreadyBorrowing.has(d.id),
  );
  const departmentName = (id: string) =>
    departments.find((d) => d.id === id)?.name ?? "—";

  const handleAdd = async () => {
    if (!departmentId) {
      toast.error("Select a department to grant this course to");
      return;
    }
    if (unitOverride && Number.isNaN(Number(unitOverride))) {
      toast.error("Unit override must be a number");
      return;
    }
    try {
      await addOffering.mutateAsync({
        courseId: course.id,
        payload: {
          departmentId,
          unitOverride: unitOverride ? Number(unitOverride) : undefined,
          compulsory,
        },
      });
      toast.success(
        `${departmentName(departmentId)} can now register this course`,
      );
      setDepartmentId("");
      setUnitOverride("");
      setCompulsory(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to grant offering",
      );
    }
  };

  const handleRemove = async (offeringId: string, name: string) => {
    try {
      await removeOffering.mutateAsync({ courseId: course.id, offeringId });
      toast.success(`${name}'s access removed`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove offering",
      );
    }
  };

  return (
    <>
      <div className="space-y-5 p-6">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {departmentName(course.departmentId)}
          </span>{" "}
          is this course&apos;s home department (always eligible, at{" "}
          {course.unit} unit{course.unit === 1 ? "" : "s"}). Grant other
          departments access below — each can carry its own unit override.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <NotchedSelectField
            label="Department"
            labelClassName="bg-popover"
            value={departmentId}
            onValueChange={setDepartmentId}
            options={borrowableDepartments.map((d) => ({
              label: d.name,
              value: d.id,
            }))}
            placeholder={
              borrowableDepartments.length === 0
                ? "All departments already have access"
                : "Select department"
            }
          />
          <NotchedField
            label="Unit Override (optional)"
            labelClassName="bg-popover"
            type="number"
            min={1}
            max={10}
            placeholder={String(course.unit)}
            value={unitOverride}
            onChange={(event) => setUnitOverride(event.target.value)}
          />
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-md border border-border p-3.5">
          <span className="pr-4 text-sm">
            <span className="block font-medium text-foreground">
              Compulsory for that department
            </span>
            <span className="block text-xs text-muted-foreground">
              Treated as a real requirement, not an elective, once borrowed.
            </span>
          </span>
          <Switch checked={compulsory} onCheckedChange={setCompulsory} />
        </label>

        <Button
          type="button"
          variant="outline"
          className="w-full gap-1.5"
          disabled={addOffering.isPending}
          onClick={handleAdd}
        >
          <Share2 className="size-3.5" />
          Grant Access
        </Button>

        <div className="space-y-2">
          {offerings && offerings.length > 0 ? (
            offerings.map((offering) => (
              <div
                key={offering.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {departmentName(offering.departmentId)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {offering.unitOverride ?? course.unit} unit
                    {(offering.unitOverride ?? course.unit) === 1 ? "" : "s"}
                    {offering.compulsory ? " · Compulsory" : " · Elective"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${departmentName(offering.departmentId)}`}
                  onClick={() =>
                    handleRemove(
                      offering.id,
                      departmentName(offering.departmentId),
                    )
                  }
                  className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          ) : (
            <p className="py-2 text-center text-sm text-muted-foreground">
              No other department borrows this course yet.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
