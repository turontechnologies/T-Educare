"use client";

import { useRef, useState } from "react";
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
import { fullName } from "@/lib/students";
import { cn } from "@/lib/utils";
import { useCreateStudent, useUpdateStudent } from "@/hooks/use-students";
import { useAcademicsStore } from "@/store/academics.store";
import { useDepartmentsStore } from "@/store/departments.store";
import { useFacultiesStore } from "@/store/faculties.store";
import { useProgramLevelsStore } from "@/store/program-levels.store";
import { useProgramsStore } from "@/store/programs.store";
import { useSchoolsStore } from "@/store/schools.store";
import {
  BLOOD_GROUPS,
  GENOTYPES,
  MARITAL_STATUSES,
  RELIGIONS,
  STUDENT_TITLES,
  type AdmissionMode,
  type BloodGroup,
  type Genotype,
  type MaritalStatus,
  type Religion,
  type Student,
  type StudentGender,
  type StudentTitle,
} from "@/types/student";

const ADMISSION_MODE_OPTIONS: { label: string; value: AdmissionMode }[] = [
  { label: "UTME", value: "UTME" },
  { label: "Direct Entry", value: "DIRECT_ENTRY" },
];

const TITLE_OPTIONS = STUDENT_TITLES.map((value) => ({ label: value, value }));
const GENDER_OPTIONS: { label: string; value: StudentGender }[] = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];
const MARITAL_OPTIONS = MARITAL_STATUSES.map((value) => ({
  label: value,
  value,
}));
const RELIGION_OPTIONS = RELIGIONS.map((value) => ({ label: value, value }));
const BLOOD_GROUP_OPTIONS = BLOOD_GROUPS.map((value) => ({
  label: value,
  value,
}));
const GENOTYPE_OPTIONS = GENOTYPES.map((value) => ({ label: value, value }));

const NIGERIAN_STATES = [
  "Lagos",
  "Ogun",
  "Oyo",
  "Kaduna",
  "Rivers",
  "Enugu",
  "Kano",
  "Edo",
  "Delta",
  "Anambra",
].map((value) => ({ label: value, value }));

interface StudentFormValues {
  matricNo: string;
  jambRegNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  otherName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  maidenName: string;
  weightKg: number;
  heightCm: number;
  nationality: string;
  lga: string;
  residentAddress: string;
  hostelName: string;
  roomNumber: string;
  allergies: string;
  chronicConditions: string;
  currentMedications: string;
  pastSurgeries: string;
  physicianName: string;
  physicianPhone: string;
  healthInsuranceProvider: string;
  healthInsuranceNumber: string;
  medicalNotes: string;
}

interface StudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing student (or pre-student). */
  student?: Student;
}

export function StudentDialog({
  open,
  onOpenChange,
  student,
}: StudentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-4xl gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {student ? "Edit Student" : "Add New Student"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed so switching between "add" and "edit — student X" starts from clean defaults without an effect resetting state. */}
        {open && (
          <StudentForm
            key={student?.id ?? "new"}
            student={student}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="col-span-full mt-2 text-xs font-semibold tracking-wide text-secondary uppercase first:mt-0">
      {children}
    </p>
  );
}

function StudentForm({
  student,
  onDone,
}: {
  student?: Student;
  onDone: () => void;
}) {
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const sessions = useAcademicsStore((state) => state.sessions);
  const schools = useSchoolsStore((state) => state.schools);
  const faculties = useFacultiesStore((state) => state.faculties);
  const departments = useDepartmentsStore((state) => state.departments);
  const programs = useProgramsStore((state) => state.programs);
  const programLevels = useProgramLevelsStore((state) => state.programLevels);

  const [title, setTitle] = useState<StudentTitle | "">(student?.title ?? "");
  const [gender, setGender] = useState<StudentGender | "">(
    student?.gender ?? "",
  );
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus | "">(
    student?.maritalStatus ?? "",
  );
  const [religion, setReligion] = useState<Religion | "">(
    student?.religion ?? "",
  );
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | "">(
    student?.bloodGroup ?? "",
  );
  const [genotype, setGenotype] = useState<Genotype | "">(
    student?.genotype ?? "",
  );
  const [stateOfOrigin, setStateOfOrigin] = useState(
    student?.stateOfOrigin ?? "",
  );
  const [dateOfBirth, setDateOfBirth] = useState(
    student?.dateOfBirth ? student.dateOfBirth.slice(0, 10) : "",
  );
  const [schoolId, setSchoolId] = useState(student?.schoolId ?? "");
  const [facultyId, setFacultyId] = useState(student?.facultyId ?? "");
  const [departmentId, setDepartmentId] = useState(student?.departmentId ?? "");
  const [programId, setProgramId] = useState(student?.programId ?? "");
  const [programLevelId, setProgramLevelId] = useState(
    student?.programLevelId ?? "",
  );
  const [sessionId, setSessionId] = useState(student?.currentSessionId ?? "");
  const [admissionMode, setAdmissionMode] = useState<AdmissionMode | "">(
    student?.admissionMode ?? "UTME",
  );
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    student?.avatarUrl,
  );
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState } = useForm<StudentFormValues>({
    defaultValues: {
      matricNo: student?.matricNo ?? "",
      jambRegNumber: student?.jambRegNumber ?? "",
      firstName: student?.firstName ?? "",
      middleName: student?.middleName ?? "",
      lastName: student?.lastName ?? "",
      otherName: student?.otherName ?? "",
      email: student?.email ?? "",
      phone: student?.phone ?? "",
      emergencyContact: student?.emergencyContact ?? "",
      maidenName: student?.maidenName ?? "",
      weightKg: student?.weightKg ?? 65,
      heightCm: student?.heightCm ?? 170,
      nationality: student?.nationality ?? "Nigeria",
      lga: student?.lga ?? "",
      residentAddress: student?.residentAddress ?? "",
      hostelName: student?.hostelName ?? "",
      roomNumber: student?.roomNumber ?? "",
      allergies: student?.allergies ?? "",
      chronicConditions: student?.chronicConditions ?? "",
      currentMedications: student?.currentMedications ?? "",
      pastSurgeries: student?.pastSurgeries ?? "",
      physicianName: student?.physicianName ?? "",
      physicianPhone: student?.physicianPhone ?? "",
      healthInsuranceProvider: student?.healthInsuranceProvider ?? "",
      healthInsuranceNumber: student?.healthInsuranceNumber ?? "",
      medicalNotes: student?.medicalNotes ?? "",
    },
  });

  const handlePhotoFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setAvatarPreview(await readFileAsDataUrl(file));
  };

  const onSubmit = async (values: StudentFormValues) => {
    if (
      !title ||
      !gender ||
      !maritalStatus ||
      !religion ||
      !bloodGroup ||
      !genotype ||
      !stateOfOrigin ||
      !dateOfBirth ||
      !schoolId ||
      !facultyId ||
      !departmentId ||
      !programId ||
      !programLevelId ||
      !sessionId ||
      !admissionMode
    ) {
      toast.error("Fill in every required field before saving");
      return;
    }

    const payload = {
      matricNo: values.matricNo.trim() || undefined,
      jambRegNumber: values.jambRegNumber.trim() || undefined,
      admissionMode,
      firstName: values.firstName,
      middleName: values.middleName.trim() || undefined,
      lastName: values.lastName,
      otherName: values.otherName.trim() || undefined,
      email: values.email,
      phone: values.phone,
      emergencyContact: values.emergencyContact,
      maidenName: values.maidenName.trim() || undefined,
      weightKg: Number(values.weightKg),
      heightCm: Number(values.heightCm),
      nationality: values.nationality,
      lga: values.lga,
      residentAddress: values.residentAddress,
      hostelName: values.hostelName.trim() || undefined,
      roomNumber: values.roomNumber.trim() || undefined,
      allergies: values.allergies.trim() || undefined,
      chronicConditions: values.chronicConditions.trim() || undefined,
      currentMedications: values.currentMedications.trim() || undefined,
      pastSurgeries: values.pastSurgeries.trim() || undefined,
      physicianName: values.physicianName.trim() || undefined,
      physicianPhone: values.physicianPhone.trim() || undefined,
      healthInsuranceProvider:
        values.healthInsuranceProvider.trim() || undefined,
      healthInsuranceNumber: values.healthInsuranceNumber.trim() || undefined,
      medicalNotes: values.medicalNotes.trim() || undefined,
      title,
      gender,
      maritalStatus,
      religion,
      bloodGroup,
      genotype,
      stateOfOrigin,
      dateOfBirth: new Date(dateOfBirth).toISOString(),
      schoolId,
      facultyId,
      departmentId,
      programId,
      programLevelId,
      currentSessionId: sessionId,
      avatarUrl: avatarPreview,
    };

    try {
      if (student) {
        await updateStudent.mutateAsync({ id: student.id, payload });
        toast.success(`${fullName(payload)} updated`);
      } else {
        const created = await createStudent.mutateAsync(payload);
        toast.success(
          created.matricNo
            ? `${fullName(created)} added`
            : `${fullName(created)} added as a pre-student — assign a matric number once admission is finalized`,
        );
      }
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save student",
      );
    }
  };

  return (
    <>
      <form
        id="student-form"
        onSubmit={handleSubmit(onSubmit)}
        className="max-h-[70vh] overflow-y-auto p-6"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <SectionLabel>Personal Information</SectionLabel>
          <NotchedSelectField
            label="Title"
            labelClassName="bg-popover"
            value={title}
            onValueChange={(value) => setTitle(value as StudentTitle)}
            options={TITLE_OPTIONS}
            placeholder="Select title"
          />
          <NotchedField
            label="First Name"
            labelClassName="bg-popover"
            placeholder="e.g. Chidinma"
            {...register("firstName", { required: true })}
          />
          <NotchedField
            label="Last Name"
            labelClassName="bg-popover"
            placeholder="e.g. Okafor"
            {...register("lastName", { required: true })}
          />
          <NotchedField
            label="Other Name"
            labelClassName="bg-popover"
            placeholder="e.g. Femi"
            {...register("otherName")}
          />

          <NotchedField
            label="Middle Name"
            labelClassName="bg-popover"
            placeholder="e.g. Kelechi"
            {...register("middleName")}
          />
          <NotchedSelectField
            label="Gender"
            labelClassName="bg-popover"
            value={gender}
            onValueChange={(value) => setGender(value as StudentGender)}
            options={GENDER_OPTIONS}
            placeholder="Select gender"
          />
          <NotchedSelectField
            label="Marital Status"
            labelClassName="bg-popover"
            value={maritalStatus}
            onValueChange={(value) => setMaritalStatus(value as MaritalStatus)}
            options={MARITAL_OPTIONS}
            placeholder="Select status"
          />
          <NotchedDateField
            label="Date of Birth"
            labelClassName="bg-popover"
            value={dateOfBirth}
            onValueChange={setDateOfBirth}
          />

          <NotchedSelectField
            label="Religion"
            labelClassName="bg-popover"
            value={religion}
            onValueChange={(value) => setReligion(value as Religion)}
            options={RELIGION_OPTIONS}
            placeholder="Select religion"
          />
          <NotchedField
            label="Maiden Name"
            labelClassName="bg-popover"
            placeholder="If applicable"
            {...register("maidenName")}
          />
          <NotchedField
            label="Nationality"
            labelClassName="bg-popover"
            {...register("nationality", { required: true })}
          />
          <NotchedSelectField
            label="State of Origin"
            labelClassName="bg-popover"
            value={stateOfOrigin}
            onValueChange={setStateOfOrigin}
            options={NIGERIAN_STATES}
            placeholder="Select state"
          />

          <SectionLabel>Contact</SectionLabel>
          <NotchedField
            label="Email Address"
            labelClassName="bg-popover"
            type="email"
            placeholder="e.g. chidinma.okafor@student.xyzcollege.edu.ng"
            {...register("email", { required: true })}
          />
          <NotchedField
            label="Phone Number"
            labelClassName="bg-popover"
            placeholder="e.g. 08037710099"
            {...register("phone", { required: true })}
          />
          <NotchedField
            label="Emergency Contact"
            labelClassName="bg-popover"
            placeholder="e.g. 08023778912"
            {...register("emergencyContact", { required: true })}
          />
          <NotchedField
            label="LGA"
            labelClassName="bg-popover"
            {...register("lga", { required: true })}
          />
          <NotchedField
            label="Resident Address"
            labelClassName="bg-popover"
            className="sm:col-span-3"
            {...register("residentAddress", { required: true })}
          />

          <SectionLabel>Bio-data</SectionLabel>
          <NotchedSelectField
            label="Blood Group"
            labelClassName="bg-popover"
            value={bloodGroup}
            onValueChange={(value) => setBloodGroup(value as BloodGroup)}
            options={BLOOD_GROUP_OPTIONS}
            placeholder="Select blood group"
          />
          <NotchedSelectField
            label="Genotype"
            labelClassName="bg-popover"
            value={genotype}
            onValueChange={(value) => setGenotype(value as Genotype)}
            options={GENOTYPE_OPTIONS}
            placeholder="Select genotype"
          />
          <NotchedField
            label="Weight (KG)"
            labelClassName="bg-popover"
            type="number"
            {...register("weightKg", { required: true, valueAsNumber: true })}
          />
          <NotchedField
            label="Height (cm)"
            labelClassName="bg-popover"
            type="number"
            {...register("heightCm", { required: true, valueAsNumber: true })}
          />

          <SectionLabel>Academic</SectionLabel>
          <div className="col-span-full -mt-2 -mb-1">
            <p className="text-xs text-muted-foreground">
              Leave Matric No. blank to save this record as a{" "}
              <span className="font-medium text-foreground">pre-student</span>{" "}
              (just admitted, not yet matriculated) — assign one later via Edit
              once admission is finalized.
            </p>
          </div>
          <NotchedField
            label="Matric No. (optional)"
            labelClassName="bg-popover"
            placeholder="e.g. UL-10044 — leave blank for a pre-student"
            {...register("matricNo")}
          />
          <NotchedSelectField
            label="Admission Mode"
            labelClassName="bg-popover"
            value={admissionMode}
            onValueChange={(value) => setAdmissionMode(value as AdmissionMode)}
            options={ADMISSION_MODE_OPTIONS}
            placeholder="Select admission mode"
          />
          <NotchedField
            label="JAMB Reg. Number (optional)"
            labelClassName="bg-popover"
            placeholder="e.g. 12345678AB"
            {...register("jambRegNumber")}
          />
          <NotchedSelectField
            label="School"
            labelClassName="bg-popover"
            value={schoolId}
            onValueChange={setSchoolId}
            options={schools
              .filter((s) => !s.archivedAt)
              .map((s) => ({ label: s.name, value: s.id }))}
            placeholder="Select school"
          />
          <NotchedSelectField
            label="Faculty"
            labelClassName="bg-popover"
            value={facultyId}
            onValueChange={setFacultyId}
            options={faculties
              .filter((f) => !f.archivedAt)
              .map((f) => ({ label: f.name, value: f.id }))}
            placeholder="Select faculty"
          />
          <NotchedSelectField
            label="Department"
            labelClassName="bg-popover"
            value={departmentId}
            onValueChange={setDepartmentId}
            options={departments
              .filter((d) => !d.archivedAt)
              .map((d) => ({ label: d.name, value: d.id }))}
            placeholder="Select department"
          />
          <NotchedSelectField
            label="Program of Study"
            labelClassName="bg-popover"
            value={programId}
            onValueChange={setProgramId}
            options={programs
              .filter((p) => !p.archivedAt)
              .map((p) => ({ label: p.name, value: p.id }))}
            placeholder="Select program"
          />
          <NotchedSelectField
            label="Current Level"
            labelClassName="bg-popover"
            value={programLevelId}
            onValueChange={setProgramLevelId}
            options={programLevels
              .filter((l) => !l.archivedAt)
              .map((l) => ({ label: l.levelCode, value: l.id }))}
            placeholder="Select level"
          />
          <NotchedSelectField
            label="Current Session"
            labelClassName="bg-popover"
            value={sessionId}
            onValueChange={setSessionId}
            options={sessions
              .filter((s) => !s.archivedAt)
              .map((s) => ({ label: s.session, value: s.id }))}
            placeholder="Select session"
          />

          <SectionLabel>Hostel</SectionLabel>
          <NotchedField
            label="Hostel Name"
            labelClassName="bg-popover"
            placeholder="e.g. Unity Hall"
            {...register("hostelName")}
          />
          <NotchedField
            label="Room Number"
            labelClassName="bg-popover"
            placeholder="e.g. B12"
            {...register("roomNumber")}
          />

          <SectionLabel>Medical History</SectionLabel>
          <NotchedField
            label="Allergies"
            labelClassName="bg-popover"
            className="sm:col-span-2"
            placeholder="e.g. Penicillin"
            {...register("allergies")}
          />
          <NotchedField
            label="Chronic Conditions"
            labelClassName="bg-popover"
            className="sm:col-span-2"
            placeholder="e.g. Asthma"
            {...register("chronicConditions")}
          />
          <NotchedField
            label="Current Medications"
            labelClassName="bg-popover"
            className="sm:col-span-2"
            {...register("currentMedications")}
          />
          <NotchedField
            label="Past Surgeries"
            labelClassName="bg-popover"
            className="sm:col-span-2"
            {...register("pastSurgeries")}
          />
          <NotchedField
            label="Physician Name"
            labelClassName="bg-popover"
            {...register("physicianName")}
          />
          <NotchedField
            label="Physician Phone"
            labelClassName="bg-popover"
            {...register("physicianPhone")}
          />
          <NotchedField
            label="Health Insurance Provider"
            labelClassName="bg-popover"
            {...register("healthInsuranceProvider")}
          />
          <NotchedField
            label="Health Insurance Number"
            labelClassName="bg-popover"
            {...register("healthInsuranceNumber")}
          />
          <NotchedField
            label="Additional Medical Notes"
            labelClassName="bg-popover"
            className="sm:col-span-4"
            {...register("medicalNotes")}
          />

          <SectionLabel>Photo</SectionLabel>
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
                    alt="Student photo preview"
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
          form="student-form"
          disabled={
            formState.isSubmitting ||
            createStudent.isPending ||
            updateStudent.isPending
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
