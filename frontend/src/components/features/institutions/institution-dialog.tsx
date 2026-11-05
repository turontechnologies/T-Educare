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
import {
  useCreateInstitution,
  useUpdateInstitution,
} from "@/hooks/use-institutions";
import { useUploadFile } from "@/hooks/use-upload";
import type { Institution } from "@/types/institution";

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
  slug: string;
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
  const createInstitution = useCreateInstitution();
  const updateInstitution = useUpdateInstitution();
  const uploadFile = useUploadFile();

  const [institutionType, setInstitutionType] = useState(
    institution?.institutionType ?? "",
  );
  const [countryState, setCountryState] = useState(
    institution?.countryState ?? "",
  );
  const [logoUrl, setLogoUrl] = useState<string | undefined>(
    institution?.logoUrl,
  );
  const [brandColor, setBrandColor] = useState(institution?.brandColor ?? "");
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
      slug: institution?.slug ?? "",
    },
  });

  const handleLogoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Instant local preview while the real upload is in flight.
    setLogoUrl(await readFileAsDataUrl(file));
    try {
      const { url } = await uploadFile.mutateAsync(file);
      setLogoUrl(url);
    } catch {
      toast.error("Failed to upload logo. Please try again.");
      setLogoUrl(institution?.logoUrl);
    }
  };

  const onSubmit = async (values: InstitutionFormValues) => {
    if (!institutionType || !countryState) {
      toast.error("Select an institution type and country/state");
      return;
    }
    if (uploadFile.isPending) {
      toast.error("Please wait for the logo to finish uploading.");
      return;
    }

    try {
      if (institution) {
        if (brandColor && !/^#[0-9a-fA-F]{6}$/.test(brandColor)) {
          toast.error("Brand color must be a hex value like #1B5E20");
          return;
        }
        await updateInstitution.mutateAsync({
          id: institution.id,
          payload: {
            ...values,
            institutionType,
            countryState,
            logoUrl,
            brandColor,
          },
        });
        toast.success(`${values.name} updated`);
      } else {
        if (brandColor && !/^#[0-9a-fA-F]{6}$/.test(brandColor)) {
          toast.error("Brand color must be a hex value like #1B5E20");
          return;
        }
        await createInstitution.mutateAsync({
          name: values.name,
          address: values.address,
          principalEmail: values.principalEmail,
          adminUser: values.adminUser,
          city: values.city,
          principalName: values.principalName,
          principalPhone: values.principalPhone,
          adminEmail: values.adminEmail,
          institutionType,
          countryState,
          logoUrl,
          slug: values.slug,
          brandColor,
        });
        toast.success(`${values.name} added`);
      }
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
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
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
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

        <div className="sm:col-span-2">
          <NotchedField
            label="Portal URL slug"
            labelClassName="bg-popover"
            placeholder={
              institution
                ? "e.g. babcock-university"
                : "Auto-generated from name if left blank"
            }
            {...register("slug")}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Used in this institution&apos;s own staff/admin and Student Portal
            sign-in links — see &quot;Portal Links&quot; in the row menu once
            it&apos;s created.
          </p>
        </div>

        <div className="sm:col-span-2">
          <p className="mb-1.5 text-sm text-muted-foreground">Brand color</p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={
                /^#[0-9a-fA-F]{6}$/.test(brandColor) ? brandColor : "#03045e"
              }
              onChange={(event) =>
                setBrandColor(event.target.value.toUpperCase())
              }
              className="size-10 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
              aria-label="Pick a brand color"
            />
            <NotchedField
              label="Hex value"
              labelClassName="bg-popover"
              placeholder="e.g. #1B5E20"
              value={brandColor}
              onChange={(event) => setBrandColor(event.target.value)}
              className="flex-1"
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Applied on this institution&apos;s own scoped sign-in screens (admin
            and Student Portal). Leave blank to use the platform&apos;s default
            navy.
          </p>
        </div>
      </form>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="submit"
          form="institution-form"
          disabled={formState.isSubmitting || uploadFile.isPending}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Submit
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
