"use client";

import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, PenTool, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NotchedComboboxField,
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import { useUploadFile } from "@/hooks/use-upload";
import {
  useCreateDepartment,
  useUpdateDepartment,
} from "@/hooks/use-departments";
import { readFileAsDataUrl } from "@/lib/files";
import { fullName } from "@/lib/lecturers";
import { useDepartmentsStore } from "@/store/departments.store";
import { useFacultiesStore } from "@/store/faculties.store";
import { useLecturersStore } from "@/store/lecturers.store";
import { useSchoolsStore } from "@/store/schools.store";
import type { Department } from "@/types/department";

/**
 * No general "staff directory" exists yet to pick a real person from — this
 * is a small curated candidate list local to this dialog, same convention
 * as School Management's "School Head" and Faculty Management's "Dean of
 * Faculty" fields.
 */
const HOD_CANDIDATES = [
  "Dr. Solomon Olusegun",
  "Alh. Mustapha George",
  "Prof. Ngozi Eze",
  "Chief Adebayo Fashola",
  "Engr. Chukwuemeka Okafor",
  "Alh. Gbenga Olusegun",
  "Dr. Amina Bello",
];

interface DepartmentFormValues {
  name: string;
}

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing department. */
  department?: Department;
}

export function DepartmentDialog({
  open,
  onOpenChange,
  department,
}: DepartmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-lg gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {department ? "Edit Department" : "Add New Department"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed so switching between "add" and "edit — department X" starts from clean defaults without an effect resetting state. */}
        {open && (
          <DepartmentForm
            key={department?.id ?? "new"}
            department={department}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DepartmentForm({
  department,
  onDone,
}: {
  department?: Department;
  onDone: () => void;
}) {
  const departments = useDepartmentsStore((state) => state.departments);
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const faculties = useFacultiesStore((state) => state.faculties);
  const schools = useSchoolsStore((state) => state.schools);
  const lecturers = useLecturersStore((state) => state.lecturers);
  const uploadFile = useUploadFile();
  const activeFaculties = useMemo(
    () => faculties.filter((f) => !f.archivedAt),
    [faculties],
  );
  const activeSchools = useMemo(
    () => schools.filter((s) => !s.archivedAt),
    [schools],
  );
  const activeLecturers = useMemo(
    () => lecturers.filter((l) => !l.archivedAt),
    [lecturers],
  );

  const [hodName, setHodName] = useState(department?.hodName ?? "");
  const [hodLecturerId, setHodLecturerId] = useState(
    department?.hodLecturerId ?? "",
  );
  const [hodSignatureUrl, setHodSignatureUrl] = useState<string | undefined>(
    department?.hodSignatureUrl ?? undefined,
  );
  const [facultyId, setFacultyId] = useState(department?.facultyId ?? "");
  const [schoolId, setSchoolId] = useState(department?.schoolId ?? "");
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const handleSignatureChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setHodSignatureUrl(await readFileAsDataUrl(file));
    try {
      const { url } = await uploadFile.mutateAsync(file);
      setHodSignatureUrl(url);
    } catch {
      toast.error("Failed to upload signature. Please try again.");
      setHodSignatureUrl(department?.hodSignatureUrl ?? undefined);
    }
  };

  const { register, handleSubmit, formState } = useForm<DepartmentFormValues>({
    defaultValues: {
      name: department?.name ?? "",
    },
  });

  const onSubmit = async (values: DepartmentFormValues) => {
    if (!hodName || !facultyId || !schoolId) {
      toast.error("Select a H.O.D, faculty, and school");
      return;
    }
    const name = values.name.trim();
    const duplicate = departments.some(
      (d) =>
        d.id !== department?.id &&
        !d.archivedAt &&
        d.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      toast.error(`A department named "${name}" already exists`);
      return;
    }

    const payload = {
      name,
      hodName,
      hodLecturerId: hodLecturerId || "",
      hodSignatureUrl: hodSignatureUrl ?? "",
      facultyId,
      schoolId,
    };

    try {
      if (department) {
        await updateDepartment.mutateAsync({ id: department.id, payload });
        toast.success(`${name} updated`);
      } else {
        const created = await createDepartment.mutateAsync(payload);
        toast.success(`${created.name} added`);
      }
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save department",
      );
    }
  };

  return (
    <>
      <form
        id="department-form"
        onSubmit={handleSubmit(onSubmit)}
        className="max-h-[70vh] space-y-5 overflow-y-auto p-6"
      >
        <NotchedField
          label="Department Name"
          labelClassName="bg-popover"
          placeholder="e.g. Mathematics Department"
          {...register("name", { required: true })}
        />
        <NotchedComboboxField
          label="H.O.D"
          labelClassName="bg-popover"
          value={hodName}
          onValueChange={setHodName}
          options={HOD_CANDIDATES.map((name) => ({ label: name, value: name }))}
          placeholder="Select H.O.D"
          searchPlaceholder="Search names…"
          emptyText="No name found."
        />

        <NotchedComboboxField
          label="Linked HOD lecturer account (optional)"
          labelClassName="bg-popover"
          value={hodLecturerId}
          onValueChange={setHodLecturerId}
          options={activeLecturers.map((l) => ({
            label: fullName(l),
            value: l.id,
          }))}
          placeholder="None — H.O.D has no lecturer account"
          searchPlaceholder="Search lecturers…"
          emptyText="No lecturer found."
        />
        <p className="-mt-3 text-xs text-muted-foreground">
          Only needed if this HOD has a real lecturer login — lets them see
          every course in this department for Results, not just their own.
        </p>

        <div className="flex items-center gap-4 rounded-md border border-border p-3.5">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted">
            {hodSignatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hodSignatureUrl}
                alt="HOD signature preview"
                className="size-full object-contain p-1"
              />
            ) : (
              <PenTool className="size-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">HOD Signature</p>
            <p className="text-xs text-muted-foreground">
              Shown on this department&apos;s own Course Registration Slips.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => signatureInputRef.current?.click()}
            disabled={uploadFile.isPending}
            className="shrink-0 gap-1.5 rounded-md"
          >
            Upload
            <Upload className="size-3.5" />
          </Button>
          <input
            ref={signatureInputRef}
            type="file"
            accept="image/*"
            onChange={handleSignatureChange}
            className="sr-only"
          />
        </div>

        <NotchedSelectField
          label="Faculty"
          labelClassName="bg-popover"
          value={facultyId}
          onValueChange={setFacultyId}
          options={activeFaculties.map((f) => ({ label: f.name, value: f.id }))}
          placeholder="Select faculty"
        />
        <NotchedSelectField
          label="School"
          labelClassName="bg-popover"
          value={schoolId}
          onValueChange={setSchoolId}
          options={activeSchools.map((s) => ({ label: s.name, value: s.id }))}
          placeholder="Select school"
        />
      </form>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="submit"
          form="department-form"
          disabled={
            formState.isSubmitting ||
            createDepartment.isPending ||
            updateDepartment.isPending
          }
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Save
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
