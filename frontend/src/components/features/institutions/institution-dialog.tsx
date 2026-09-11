"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, ImagePlus, Upload, X } from "lucide-react";
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
import { readFileAsDataUrl } from "@/lib/files";
import { notifyInstitution, notifyPlatform } from "@/lib/notify";
import { useInstitutionsStore } from "@/store/institutions.store";
import type { Institution, LicenseType } from "@/types/institution";

const INSTITUTION_TYPES = [
  "University",
  "Polytechnic",
  "College",
  "Secondary School",
  "Primary School",
];

const COUNTRY_STATES = [
  "Nigeria - Lagos State",
  "Nigeria - Ogun State",
  "Nigeria - Oyo State",
  "Nigeria - Kaduna State",
  "Nigeria - Rivers State",
  "Nigeria - FCT Abuja",
  "Nigeria - Kano State",
  "Nigeria - Enugu State",
  "Nigeria - Edo State",
  "Nigeria - Delta State",
  "Nigeria - Imo State",
  "Nigeria - Anambra State",
];

interface InstitutionFormValues {
  name: string;
  address: string;
  principalEmail: string;
  adminUser: string;
  city: string;
  principalName: string;
  principalPhone: string;
  adminEmail: string;
}

interface InstitutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing institution. */
  institution?: Institution;
}

export function InstitutionDialog({
  open,
  onOpenChange,
  institution,
}: InstitutionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-2xl gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {institution ? "Edit Institution" : "Add New Institutions"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed so switching between "add" and "edit — institution X" starts from clean defaults without an effect resetting state. */}
        {open && (
          <InstitutionForm
            key={institution?.id ?? "new"}
            institution={institution}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function InstitutionForm({
  institution,
  onDone,
}: {
  institution?: Institution;
  onDone: () => void;
}) {
  const createInstitution = useInstitutionsStore(
    (state) => state.createInstitution,
  );
  const updateInstitution = useInstitutionsStore(
    (state) => state.updateInstitution,
  );

  const [institutionType, setInstitutionType] = useState(
    institution?.institutionType ?? "",
  );
  const [countryState, setCountryState] = useState(
    institution?.countryState ?? "",
  );
  const [logoPreview, setLogoPreview] = useState<string | undefined>(
    institution?.logoUrl,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState } = useForm<InstitutionFormValues>({
    defaultValues: {
      name: institution?.name ?? "",
      address: institution?.address ?? "",
      principalEmail: institution?.principalEmail ?? "",
      adminUser: institution?.adminUser ?? "",
      city: institution?.city ?? "",
      principalName: institution?.principalName ?? "",
      principalPhone: institution?.principalPhone ?? "",
      adminEmail: institution?.adminEmail ?? "",
    },
  });

  const handleLogoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) setLogoPreview(await readFileAsDataUrl(file));
  };

  const onSubmit = (values: InstitutionFormValues) => {
    if (!institutionType || !countryState) {
      toast.error("Select an institution type and country/state");
      return;
    }

    if (institution) {
      updateInstitution(institution.id, {
        ...values,
        institutionType,
        countryState,
        logoUrl: logoPreview,
      });
      toast.success(`${values.name} updated`);
      notifyPlatform(
        "Institution updated",
        `${values.name}'s details were updated.`,
        "/super-admin/institutions",
      );
      notifyInstitution(
        institution.id,
        "Your institution's details were updated",
        "The platform administrator updated your institution's profile.",
      );
    } else {
      const created = createInstitution({
        ...values,
        institutionType,
        countryState,
        logoUrl: logoPreview,
        modulesCount: 0,
        studentCount: 0,
        revenue: 0,
        licenseType: "Basic" as LicenseType,
        expiringAt: null,
        status: "active",
      });
      toast.success(`${values.name} added`);
      notifyPlatform(
        "New institution added",
        `${created.name} was added to the platform.`,
        "/super-admin/institutions",
      );
    }
    onDone();
  };

  return (
    <>
      <form
        id="institution-form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid max-h-[65vh] gap-5 overflow-y-auto p-6 sm:grid-cols-2"
      >
        <NotchedField
          label="Name of Institution"
          labelClassName="bg-popover"
          placeholder="e.g. Babcock University"
          {...register("name", { required: true })}
        />

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-secondary/40 bg-muted"
          >
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoPreview}
                alt="Institution logo preview"
                className="size-full object-cover"
              />
            ) : (
              <ImagePlus className="size-6 text-muted-foreground" />
            )}
          </button>
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">
              You can change your profile picture
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 rounded-md"
            >
              Upload
              <Upload className="size-3.5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="sr-only"
            />
          </div>
        </div>

        <NotchedSelectField
          label="Type of Institution"
          labelClassName="bg-popover"
          value={institutionType}
          onValueChange={setInstitutionType}
          options={INSTITUTION_TYPES.map((type) => ({
            label: type,
            value: type,
          }))}
          placeholder="Select type"
        />

        <NotchedField
          label="City"
          labelClassName="bg-popover"
          placeholder="e.g. Ilishan-Remo"
          {...register("city", { required: true })}
        />

        <NotchedField
          label="Address of Institution"
          labelClassName="bg-popover"
          placeholder="e.g. PMB 4003"
          {...register("address", { required: true })}
        />

        <NotchedField
          label="Name of Principal"
          labelClassName="bg-popover"
          placeholder="e.g. Mr Chris Smart"
          {...register("principalName", { required: true })}
        />

        <NotchedComboboxField
          label="Country/State"
          labelClassName="bg-popover"
          value={countryState}
          onValueChange={setCountryState}
          options={COUNTRY_STATES.map((state) => ({
            label: state,
            value: state,
          }))}
          placeholder="Select country/state"
          searchPlaceholder="Search states…"
          emptyText="No state found."
        />

        <NotchedField
          label="Principal Phone Number"
          labelClassName="bg-popover"
          placeholder="e.g. 08025771099"
          {...register("principalPhone", { required: true })}
        />

        <NotchedField
          label="Principal Email Address"
          labelClassName="bg-popover"
          type="email"
          placeholder="e.g. chris-smart@gmail.com"
          {...register("principalEmail", { required: true })}
        />

        <NotchedField
          label="Primary Admin Email"
          labelClassName="bg-popover"
          type="email"
          placeholder="e.g. solomon.odogun@gmail.com"
          {...register("adminEmail", { required: true })}
        />

        <NotchedField
          label="Primary Admin Name"
          labelClassName="bg-popover"
          placeholder="e.g. Solomon Odogun"
          {...register("adminUser", { required: true })}
        />
      </form>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="submit"
          form="institution-form"
          disabled={formState.isSubmitting}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Submit
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
