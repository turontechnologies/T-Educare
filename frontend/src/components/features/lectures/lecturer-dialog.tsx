"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import { fullName } from "@/lib/lecturers";
import { useFacultiesStore } from "@/store/faculties.store";
import { useLecturersStore } from "@/store/lecturers.store";
import { useSchoolsStore } from "@/store/schools.store";
import {
  LECTURER_POSITIONS,
  type Lecturer,
  type LecturerAssignmentType,
  type LecturerGender,
  type LecturerPosition,
} from "@/types/lecturer";

const GENDER_OPTIONS: { label: string; value: LecturerGender }[] = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];
const POSITION_OPTIONS = LECTURER_POSITIONS.map((value) => ({
  label: value,
  value,
}));
const ASSIGNMENT_TYPE_OPTIONS: {
  label: string;
  value: LecturerAssignmentType;
}[] = [
  { label: "School", value: "school" },
  { label: "Faculty", value: "faculty" },
];

interface LecturerFormValues {
  username: string;
  firstName: string;
  middleName: string;
  lastName: string;
  otherName: string;
  email: string;
  phone: string;
}

interface LecturerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing lecturer. */
  lecturer?: Lecturer;
}

export function LecturerDialog({
  open,
  onOpenChange,
  lecturer,
}: LecturerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-2xl gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {lecturer ? "Edit Lecturer" : "Add New Lecturer"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed so switching between "add" and "edit — lecturer X" starts from clean defaults without an effect resetting state. */}
        {open && (
          <LecturerForm
            key={lecturer?.id ?? "new"}
            lecturer={lecturer}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function nextUsername(existing: Lecturer[]) {
  let n = 10000 + existing.length;
  const taken = new Set(existing.map((l) => l.username));
  let candidate = `UL-${n}`;
  while (taken.has(candidate)) {
    n++;
    candidate = `UL-${n}`;
  }
  return candidate;
}

function LecturerForm({
  lecturer,
  onDone,
}: {
  lecturer?: Lecturer;
  onDone: () => void;
}) {
  const lecturers = useLecturersStore((state) => state.lecturers);
  const createLecturer = useLecturersStore((state) => state.createLecturer);
  const updateLecturer = useLecturersStore((state) => state.updateLecturer);
  const schools = useSchoolsStore((state) => state.schools);
  const faculties = useFacultiesStore((state) => state.faculties);
  const activeSchools = useMemo(
    () => schools.filter((s) => !s.archivedAt),
    [schools],
  );
  const activeFaculties = useMemo(
    () => faculties.filter((f) => !f.archivedAt),
    [faculties],
  );

  const [position, setPosition] = useState<LecturerPosition | "">(
    lecturer?.position ?? "",
  );
  const [assignmentType, setAssignmentType] = useState<
    LecturerAssignmentType | ""
  >(lecturer?.assignmentType ?? "");
  const [assignmentId, setAssignmentId] = useState(
    lecturer?.assignmentId ?? "",
  );
  const [gender, setGender] = useState<LecturerGender | "">(
    lecturer?.gender ?? "",
  );

  const assignmentOptions =
    assignmentType === "school"
      ? activeSchools.map((s) => ({ label: s.name, value: s.id }))
      : assignmentType === "faculty"
        ? activeFaculties.map((f) => ({ label: f.name, value: f.id }))
        : [];

  const { register, handleSubmit, formState } = useForm<LecturerFormValues>({
    defaultValues: {
      username: lecturer?.username ?? nextUsername(lecturers),
      firstName: lecturer?.firstName ?? "",
      middleName: lecturer?.middleName ?? "",
      lastName: lecturer?.lastName ?? "",
      otherName: lecturer?.otherName ?? "",
      email: lecturer?.email ?? "",
      phone: lecturer?.phone ?? "",
    },
  });

  const onSubmit = (values: LecturerFormValues) => {
    if (!position || !assignmentType || !assignmentId || !gender) {
      toast.error("Select a position, gender, and school/faculty assignment");
      return;
    }
    const username = values.username.trim();
    const duplicate = lecturers.some(
      (l) =>
        l.id !== lecturer?.id &&
        !l.archivedAt &&
        l.username.toLowerCase() === username.toLowerCase(),
    );
    if (duplicate) {
      toast.error(`Username "${username}" is already in use`);
      return;
    }

    const payload = {
      ...values,
      username,
      middleName: values.middleName.trim() || undefined,
      otherName: values.otherName.trim() || undefined,
      position,
      assignmentType,
      assignmentId,
      gender,
    };

    if (lecturer) {
      updateLecturer(lecturer.id, payload);
      toast.success(`${fullName(payload)} updated`);
    } else {
      const created = createLecturer(payload);
      toast.success(`${fullName(created)} added`);
    }
    onDone();
  };

  return (
    <>
      <form
        id="lecturer-form"
        onSubmit={handleSubmit(onSubmit)}
        className="max-h-[65vh] overflow-y-auto p-6"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <NotchedField
            label="Username"
            labelClassName="bg-popover"
            placeholder="e.g. UL-10021"
            {...register("username", { required: true })}
          />
          <NotchedSelectField
            label="Position"
            labelClassName="bg-popover"
            value={position}
            onValueChange={(value) => setPosition(value as LecturerPosition)}
            options={POSITION_OPTIONS}
            placeholder="Select position"
          />

          <NotchedField
            label="First Name"
            labelClassName="bg-popover"
            placeholder="e.g. Oladapo"
            {...register("firstName", { required: true })}
          />
          <NotchedField
            label="Last Name"
            labelClassName="bg-popover"
            placeholder="e.g. Babajide"
            {...register("lastName", { required: true })}
          />

          <NotchedField
            label="Middle Name"
            labelClassName="bg-popover"
            placeholder="e.g. Frank"
            {...register("middleName")}
          />
          <NotchedField
            label="Other Name"
            labelClassName="bg-popover"
            placeholder="Optional"
            {...register("otherName")}
          />

          <NotchedSelectField
            label="Gender"
            labelClassName="bg-popover"
            value={gender}
            onValueChange={(value) => setGender(value as LecturerGender)}
            options={GENDER_OPTIONS}
            placeholder="Select gender"
          />
          <NotchedField
            label="Email Address"
            labelClassName="bg-popover"
            type="email"
            placeholder="e.g. oladapo.babajide@staff.xyzcollege.edu.ng"
            {...register("email", { required: true })}
          />

          <NotchedField
            label="Phone"
            labelClassName="bg-popover"
            placeholder="e.g. 08038829911"
            {...register("phone", { required: true })}
          />
          <NotchedSelectField
            label="Assignment Type"
            labelClassName="bg-popover"
            value={assignmentType}
            onValueChange={(value) => {
              setAssignmentType(value as LecturerAssignmentType);
              setAssignmentId("");
            }}
            options={ASSIGNMENT_TYPE_OPTIONS}
            placeholder="School or Faculty"
          />

          <NotchedSelectField
            label="School / Faculty"
            labelClassName="bg-popover"
            value={assignmentId}
            onValueChange={setAssignmentId}
            options={assignmentOptions}
            placeholder={
              assignmentType
                ? `Select ${assignmentType}`
                : "Select assignment type first"
            }
            disabled={!assignmentType}
          />
        </div>
      </form>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="submit"
          form="lecturer-form"
          disabled={formState.isSubmitting}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Save
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
