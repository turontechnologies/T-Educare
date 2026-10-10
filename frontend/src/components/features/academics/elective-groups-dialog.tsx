"use client";

import { useMemo, useState } from "react";
import { ArchiveRestore, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import {
  useArchiveElectiveGroup,
  useCreateElectiveGroup,
  useElectiveGroups,
  useRestoreElectiveGroup,
} from "@/hooks/use-elective-groups";
import { useCoursesStore } from "@/store/courses.store";
import { useDepartmentsStore } from "@/store/departments.store";
import { useProgramLevelsStore } from "@/store/program-levels.store";

interface ElectiveGroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** "Choose N of these courses" requirements per department+level (API_CONTRACT.md's elective-group model). */
export function ElectiveGroupsDialog({
  open,
  onOpenChange,
}: ElectiveGroupsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-2xl gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Elective Groups
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

        {open && <ElectiveGroupsContent />}
      </DialogContent>
    </Dialog>
  );
}

function ElectiveGroupsContent() {
  const { data: groups } = useElectiveGroups(true);
  const departments = useDepartmentsStore((state) => state.departments);
  const programLevels = useProgramLevelsStore((state) => state.programLevels);
  const courses = useCoursesStore((state) => state.courses);
  const createGroup = useCreateElectiveGroup();
  const archiveGroup = useArchiveElectiveGroup();
  const restoreGroup = useRestoreElectiveGroup();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [programLevelId, setProgramLevelId] = useState("");
  const [minSelect, setMinSelect] = useState("1");
  const [maxSelect, setMaxSelect] = useState("1");
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(
    new Set(),
  );

  const departmentName = (id: string) =>
    departments.find((d) => d.id === id)?.name ?? "—";
  const levelName = (id: string) =>
    programLevels.find((l) => l.id === id)?.levelCode ?? "—";
  const courseLabel = (id: string) => {
    const course = courses.find((c) => c.id === id);
    return course ? `${course.code} — ${course.name}` : id;
  };

  const eligibleCourses = useMemo(
    () =>
      courses.filter(
        (c) =>
          !c.archivedAt &&
          c.departmentId === departmentId &&
          c.programLevelId === programLevelId,
      ),
    [courses, departmentId, programLevelId],
  );

  const resetForm = () => {
    setName("");
    setDepartmentId("");
    setProgramLevelId("");
    setMinSelect("1");
    setMaxSelect("1");
    setSelectedCourseIds(new Set());
  };

  const toggleCourse = (id: string) => {
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!departmentId || !programLevelId) {
      toast.error("Select a department and program level");
      return;
    }
    if (!name.trim()) {
      toast.error("Enter a group name");
      return;
    }
    if (selectedCourseIds.size < 2) {
      toast.error("Pick at least two courses to choose between");
      return;
    }
    const min = Number(minSelect);
    const max = Number(maxSelect);
    if (
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min < 1 ||
      max < min
    ) {
      toast.error("Minimum/maximum selection must be valid, with min ≤ max");
      return;
    }

    try {
      await createGroup.mutateAsync({
        departmentId,
        programLevelId,
        name: name.trim(),
        minSelect: min,
        maxSelect: max,
        courseIds: Array.from(selectedCourseIds),
      });
      toast.success(`${name.trim()} created`);
      resetForm();
      setShowForm(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create group",
      );
    }
  };

  return (
    <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
      {!showForm && (
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          onClick={() => setShowForm(true)}
        >
          <Plus className="size-3.5" />
          Add New Group
        </Button>
      )}

      {showForm && (
        <div className="space-y-4 rounded-md border border-border p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <NotchedSelectField
              label="Department"
              labelClassName="bg-popover"
              value={departmentId}
              onValueChange={(value) => {
                setDepartmentId(value);
                setSelectedCourseIds(new Set());
              }}
              options={departments
                .filter((d) => !d.archivedAt)
                .map((d) => ({ label: d.name, value: d.id }))}
              placeholder="Select department"
            />
            <NotchedSelectField
              label="Program Level"
              labelClassName="bg-popover"
              value={programLevelId}
              onValueChange={(value) => {
                setProgramLevelId(value);
                setSelectedCourseIds(new Set());
              }}
              options={programLevels
                .filter((l) => !l.archivedAt)
                .map((l) => ({ label: l.levelCode, value: l.id }))}
              placeholder="Select level"
            />
          </div>
          <NotchedField
            label="Group Name"
            labelClassName="bg-popover"
            placeholder="e.g. Elective Group 1"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <NotchedField
              label="Minimum to Select"
              labelClassName="bg-popover"
              type="number"
              min={1}
              value={minSelect}
              onChange={(event) => setMinSelect(event.target.value)}
            />
            <NotchedField
              label="Maximum to Select"
              labelClassName="bg-popover"
              type="number"
              min={1}
              value={maxSelect}
              onChange={(event) => setMaxSelect(event.target.value)}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Courses in this group
            </p>
            <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-md border border-border p-3">
              {!departmentId || !programLevelId ? (
                <p className="text-sm text-muted-foreground">
                  Select a department and level first.
                </p>
              ) : eligibleCourses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No courses found for that department and level.
                </p>
              ) : (
                eligibleCourses.map((course) => (
                  <label
                    key={course.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={selectedCourseIds.has(course.id)}
                      onCheckedChange={() => toggleCourse(course.id)}
                    />
                    {course.code} — {course.name}
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={createGroup.isPending}
              onClick={handleCreate}
            >
              Save Group
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {groups && groups.length > 0 ? (
          groups.map((group) => (
            <div
              key={group.id}
              className="rounded-md border border-border bg-muted/40 p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">
                    {group.name}
                    {group.archivedAt && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (archived)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {departmentName(group.departmentId)} ·{" "}
                    {levelName(group.programLevelId)} · choose{" "}
                    {group.minSelect === group.maxSelect
                      ? group.minSelect
                      : `${group.minSelect}–${group.maxSelect}`}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {group.courseIds.map(courseLabel).join(", ")}
                  </p>
                </div>
                {group.archivedAt ? (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await restoreGroup.mutateAsync(group.id);
                        toast.success(`${group.name} restored`);
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Failed to restore group",
                        );
                      }
                    }}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-secondary transition-colors hover:bg-secondary/10"
                  >
                    <ArchiveRestore className="size-3.5" />
                    Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label={`Delete ${group.name}`}
                    onClick={async () => {
                      try {
                        await archiveGroup.mutateAsync(group.id);
                        toast.success(`${group.name} deleted`);
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Failed to delete group",
                        );
                      }
                    }}
                    className="shrink-0 cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No elective groups yet.
          </p>
        )}
      </div>
    </div>
  );
}
