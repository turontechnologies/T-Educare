"use client";

import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, Upload, User, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NotchedDateField,
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import { readFileAsDataUrl } from "@/lib/files";
import { fullName } from "@/lib/staff-members";
import { cn } from "@/lib/utils";
import { useDepartmentsStore } from "@/store/departments.store";
import { useStaffStore } from "@/store/staff.store";
import { useStaffMembersStore } from "@/store/staff-members.store";
import {
  STAFF_MARITAL_STATUSES,
  type StaffGender,
  type StaffMaritalStatus,
  type StaffMember,
} from "@/types/staff-member";

const GENDER_OPTIONS: { label: string; value: StaffGender }[] = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];
const MARITAL_OPTIONS = STAFF_MARITAL_STATUSES.map((value) => ({
  label: value,
  value,
}));

interface StaffMemberFormValues {
  staffId: string;
  firstName: string;
  lastName: string;
  otherName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  contactAddress: string;
  middleName: string;
}

interface StaffMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing staff member. */
  staffMember?: StaffMember;
}

export function StaffMemberDialog({
  open,
  onOpenChange,
  staffMember,
}: StaffMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-3xl gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {staffMember ? "Edit Staff" : "Add New Staff"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed so switching between "add" and "edit — staff X" starts from clean defaults without an effect resetting state. */}
        {open && (
          <StaffMemberForm
            key={staffMember?.id ?? "new"}
            staffMember={staffMember}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function nextStaffId(existing: StaffMember[]) {
  let n = 10000 + existing.length;
  const taken = new Set(existing.map((s) => s.staffId));
  let candidate = `UL-${n}`;
  while (taken.has(candidate)) {
    n++;
    candidate = `UL-${n}`;
  }
  return candidate;
}

function StaffMemberForm({
  staffMember,
  onDone,
}: {
  staffMember?: StaffMember;
  onDone: () => void;
}) {
  const staffMembers = useStaffMembersStore((state) => state.staffMembers);
  const createStaffMember = useStaffMembersStore(
    (state) => state.createStaffMember,
  );
  const updateStaffMember = useStaffMembersStore(
    (state) => state.updateStaffMember,
  );
  const designations = useStaffStore((state) => state.designations);
  const departments = useDepartmentsStore((state) => state.departments);
  const activeDesignations = useMemo(
    () => designations.filter((d) => !d.archivedAt),
    [designations],
  );
  const activeDepartments = useMemo(
    () => departments.filter((d) => !d.archivedAt),
    [departments],
  );

  const [role, setRole] = useState(staffMember?.role ?? "");
  const [designation, setDesignation] = useState(
    staffMember?.designation ?? "",
  );
  const [departmentId, setDepartmentId] = useState(
    staffMember?.departmentId ?? "",
  );
  const [gender, setGender] = useState<StaffGender | "">(
    staffMember?.gender ?? "",
  );
  const [maritalStatus, setMaritalStatus] = useState<StaffMaritalStatus | "">(
    staffMember?.maritalStatus ?? "",
  );
  const [dateOfBirth, setDateOfBirth] = useState(
    staffMember?.dateOfBirth ? staffMember.dateOfBirth.slice(0, 10) : "",
  );
  const [employmentStartDate, setEmploymentStartDate] = useState(
    staffMember?.employmentStartDate
      ? staffMember.employmentStartDate.slice(0, 10)
      : "",
  );
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    staffMember?.avatarUrl,
  );
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState } = useForm<StaffMemberFormValues>({
    defaultValues: {
      staffId: staffMember?.staffId ?? nextStaffId(staffMembers),
      firstName: staffMember?.firstName ?? "",
      middleName: staffMember?.middleName ?? "",
      lastName: staffMember?.lastName ?? "",
      otherName: staffMember?.otherName ?? "",
      email: staffMember?.email ?? "",
      phone: staffMember?.phone ?? "",
      emergencyContact: staffMember?.emergencyContact ?? "",
      contactAddress: staffMember?.contactAddress ?? "",
    },
  });

  const handlePhotoFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setAvatarPreview(await readFileAsDataUrl(file));
  };

  const onSubmit = (values: StaffMemberFormValues) => {
    if (
      !role ||
      !designation ||
      !departmentId ||
      !gender ||
      !maritalStatus ||
      !dateOfBirth ||
      !employmentStartDate
    ) {
      toast.error("Fill in every required field before saving");
      return;
    }
    const staffId = values.staffId.trim();
    const duplicate = staffMembers.some(
      (s) =>
        s.id !== staffMember?.id &&
        !s.archivedAt &&
        s.staffId.toLowerCase() === staffId.toLowerCase(),
    );
    if (duplicate) {
      toast.error(`Staff ID "${staffId}" is already in use`);
      return;
    }

    const payload = {
      ...values,
      staffId,
      middleName: values.middleName.trim() || undefined,
      otherName: values.otherName.trim() || undefined,
      role,
      designation,
      departmentId,
      gender,
      maritalStatus,
      dateOfBirth: new Date(dateOfBirth).toISOString(),
      employmentStartDate: new Date(employmentStartDate).toISOString(),
      avatarUrl: avatarPreview,
    };

    if (staffMember) {
      updateStaffMember(staffMember.id, payload);
      toast.success(`${fullName(payload)} updated`);
    } else {
      const created = createStaffMember(payload);
      toast.success(`${fullName(created)} added`);
    }
    onDone();
  };

  return (
    <>
      <form
        id="staff-member-form"
        onSubmit={handleSubmit(onSubmit)}
        className="max-h-[70vh] overflow-y-auto p-6"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <NotchedField
            label="Staff ID"
            labelClassName="bg-popover"
            placeholder="e.g. LS-0021"
            {...register("staffId", { required: true })}
          />
          <NotchedSelectField
            label="Role"
            labelClassName="bg-popover"
            value={role}
            onValueChange={setRole}
            options={activeDesignations.map((d) => ({
              label: d.name,
              value: d.name,
            }))}
            placeholder="Select role"
          />
          <NotchedSelectField
            label="Designation"
            labelClassName="bg-popover"
            value={designation}
            onValueChange={setDesignation}
            options={activeDesignations.map((d) => ({
              label: d.name,
              value: d.name,
            }))}
            placeholder="Select designation"
          />
          <NotchedSelectField
            label="Department"
            labelClassName="bg-popover"
            value={departmentId}
            onValueChange={setDepartmentId}
            options={activeDepartments.map((d) => ({
              label: d.name,
              value: d.id,
            }))}
            placeholder="Select department"
          />

          <NotchedSelectField
            label="Gender"
            labelClassName="bg-popover"
            value={gender}
            onValueChange={(value) => setGender(value as StaffGender)}
            options={GENDER_OPTIONS}
            placeholder="Select gender"
          />
          <NotchedField
            label="First Name"
            labelClassName="bg-popover"
            placeholder="e.g. Solomon"
            {...register("firstName", { required: true })}
          />
          <NotchedField
            label="Last Name"
            labelClassName="bg-popover"
            placeholder="e.g. Olusegun"
            {...register("lastName", { required: true })}
          />
          <NotchedField
            label="Other Name"
            labelClassName="bg-popover"
            placeholder="e.g. Femi"
            {...register("otherName")}
          />

          <NotchedSelectField
            label="Marital Status"
            labelClassName="bg-popover"
            value={maritalStatus}
            onValueChange={(value) =>
              setMaritalStatus(value as StaffMaritalStatus)
            }
            options={MARITAL_OPTIONS}
            placeholder="Select status"
          />
          <NotchedField
            label="Email Address"
            labelClassName="bg-popover"
            type="email"
            placeholder="e.g. solo.femi21@gmail.com"
            {...register("email", { required: true })}
          />
          <NotchedField
            label="Phone"
            labelClassName="bg-popover"
            placeholder="e.g. 08038829911"
            {...register("phone", { required: true })}
          />
          <NotchedField
            label="Emergency Contact"
            labelClassName="bg-popover"
            placeholder="e.g. 09023117890"
            {...register("emergencyContact", { required: true })}
          />

          <NotchedDateField
            label="Date of Birth"
            labelClassName="bg-popover"
            value={dateOfBirth}
            onValueChange={setDateOfBirth}
          />
          <NotchedDateField
            label="Employment Start Date"
            labelClassName="bg-popover"
            value={employmentStartDate}
            onValueChange={setEmploymentStartDate}
          />
          <NotchedField
            label="Contact Address"
            labelClassName="bg-popover"
            className="sm:col-span-2"
            {...register("contactAddress", { required: true })}
          />

          <div className="col-span-full">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                const file = event.dataTransfer.files?.[0];
                if (file) handlePhotoFile(file);
              }}
              className={cn(
                "flex cursor-pointer items-center gap-4 rounded-md border-2 border-dashed p-4 transition-colors",
                dragOver
                  ? "border-secondary bg-secondary/5"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt="Staff photo preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <User className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Upload className="size-4" />
                Drag and drop a file here or click
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handlePhotoFile(file);
              }}
              className="sr-only"
            />
          </div>
        </div>
      </form>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="submit"
          form="staff-member-form"
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
