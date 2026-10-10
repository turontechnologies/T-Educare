"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { NotchedSelectField } from "@/components/shared/notched-field";
import { useCreateLectureAssignment } from "@/hooks/use-lecture-assignments";
import { useAcademicsStore } from "@/store/academics.store";
import { useCoursesStore } from "@/store/courses.store";
import { useLecturersStore } from "@/store/lecturers.store";
import { fullName } from "@/lib/lecturers";

interface LectureAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Assigns a Lecturer to teach a Course for an academic session — the "Lectures" half of Lecture Management. */
export function LectureAssignmentDialog({
  open,
  onOpenChange,
}: LectureAssignmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Assign Lecturer to Course
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

        {open && <AssignmentForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function AssignmentForm({ onDone }: { onDone: () => void }) {
  const lecturers = useLecturersStore((state) => state.lecturers);
  const courses = useCoursesStore((state) => state.courses);
  const sessions = useAcademicsStore((state) => state.sessions);
  const createAssignment = useCreateLectureAssignment();

  const [lecturerId, setLecturerId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [academicSessionId, setAcademicSessionId] = useState("");

  const activeLecturers = lecturers.filter((l) => !l.archivedAt);
  const activeCourses = courses.filter((c) => !c.archivedAt);
  const activeSessions = sessions.filter((s) => !s.archivedAt);

  const handleSubmit = async () => {
    if (!lecturerId || !courseId || !academicSessionId) {
      toast.error("Select a lecturer, course, and academic session");
      return;
    }
    try {
      await createAssignment.mutateAsync({
        lecturerId,
        courseId,
        academicSessionId,
      });
      toast.success("Lecturer assigned to course");
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create assignment",
      );
    }
  };

  return (
    <div className="space-y-5 p-6">
      <NotchedSelectField
        label="Lecturer"
        labelClassName="bg-popover"
        value={lecturerId}
        onValueChange={setLecturerId}
        options={activeLecturers.map((l) => ({
          label: `${fullName(l)} (${l.username})`,
          value: l.id,
        }))}
        placeholder="Select lecturer"
      />
      <NotchedSelectField
        label="Course"
        labelClassName="bg-popover"
        value={courseId}
        onValueChange={setCourseId}
        options={activeCourses.map((c) => ({
          label: `${c.code} — ${c.name}`,
          value: c.id,
        }))}
        placeholder="Select course"
      />
      <NotchedSelectField
        label="Academic Session"
        labelClassName="bg-popover"
        value={academicSessionId}
        onValueChange={setAcademicSessionId}
        options={activeSessions.map((s) => ({
          label: s.session,
          value: s.id,
        }))}
        placeholder="Select session"
      />

      <Button
        type="button"
        className="w-full gap-2 rounded-full"
        disabled={createAssignment.isPending}
        onClick={handleSubmit}
      >
        Assign
      </Button>
    </div>
  );
}
