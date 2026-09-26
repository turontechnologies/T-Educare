"use client";

import { useState } from "react";
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
  NotchedComboboxField,
  NotchedDateField,
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import { generateKey } from "@/lib/mock-generators";
import { useInstitutions, useSaveLicense } from "@/hooks/use-institutions";
import { useInstitutionsStore } from "@/store/institutions.store";
import type { LicenseType } from "@/types/institution";

const LICENSE_TYPE_OPTIONS: { label: string; value: LicenseType }[] = [
  { label: "Basic", value: "Basic" },
  { label: "Standard", value: "Standard" },
  { label: "Premium", value: "Premium" },
];

interface LicenseFormValues {
  licenseKey: string;
}

interface LicenseManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an institution's existing license record. */
  institutionId?: string;
}

export function LicenseManagerDialog({
  open,
  onOpenChange,
  institutionId,
}: LicenseManagerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-xl gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {institutionId ? "Edit License" : "Create New License"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed so switching between "create" and "edit — institution X" starts from clean defaults without an effect resetting state. */}
        {open && (
          <LicenseForm
            key={institutionId ?? "new"}
            institutionId={institutionId}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function LicenseForm({
  institutionId,
  onDone,
}: {
  institutionId?: string;
  onDone: () => void;
}) {
  const institutions = useInstitutionsStore((state) => state.institutions);
  const saveLicense = useSaveLicense();

  const isEditing = !!institutionId;
  const initialInstitution = institutionId
    ? institutions.find((institution) => institution.id === institutionId)
    : undefined;

  // "Create New License" only offers institutions that don't have one yet —
  // fetched fresh via the server-authoritative unlicensedOnly filter
  // (API_CONTRACT.md §4.7.1), not derived client-side from the
  // already-hydrated store, so it can't go stale if another admin issued
  // one moments ago. An already-licensed institution is edited by clicking
  // its name in the table instead, not re-selected from here — so this is
  // only needed in "create" mode.
  const { data: unlicensedData } = useInstitutions(
    { unlicensedOnly: true, perPage: 1000 },
    { enabled: !institutionId },
  );
  const availableInstitutions = unlicensedData?.data ?? [];

  const [selectedInstitutionId, setSelectedInstitutionId] = useState(
    institutionId ?? "",
  );
  const [licenseType, setLicenseType] = useState<LicenseType>(
    initialInstitution?.licenseType ?? "Basic",
  );
  const [expiringAt, setExpiringAt] = useState(
    initialInstitution?.expiringAt
      ? initialInstitution.expiringAt.slice(0, 10)
      : "",
  );

  const { register, handleSubmit, setValue, formState } =
    useForm<LicenseFormValues>({
      defaultValues: {
        licenseKey: initialInstitution?.licenseKey ?? "",
      },
    });

  const handleGenerateKey = () => setValue("licenseKey", generateKey());
  const handleClearKey = () => setValue("licenseKey", "");

  const onSubmit = async (values: LicenseFormValues) => {
    if (!selectedInstitutionId) {
      toast.error("Select an institution first");
      return;
    }
    if (!values.licenseKey.trim()) {
      toast.error("Generate or enter a license key");
      return;
    }
    if (licenseType !== "Basic" && !expiringAt) {
      toast.error(`Set an expiring date for a ${licenseType} license`);
      return;
    }

    const institutionName =
      initialInstitution?.name ??
      availableInstitutions.find((i) => i.id === selectedInstitutionId)?.name;

    try {
      await saveLicense.mutateAsync({
        id: selectedInstitutionId,
        payload: {
          licenseType,
          expiringAt:
            licenseType !== "Basic"
              ? new Date(expiringAt).toISOString()
              : undefined,
          licenseKey: values.licenseKey.trim(),
        },
      });
      toast.success(`License saved for ${institutionName ?? "institution"}`);
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save license",
      );
    }
  };

  return (
    <>
      <form
        id="license-form"
        onSubmit={handleSubmit(onSubmit)}
        className="grid max-h-[65vh] gap-5 overflow-y-auto p-6 sm:grid-cols-2"
      >
        <NotchedComboboxField
          label="Select Institution"
          labelClassName="bg-popover"
          value={selectedInstitutionId}
          onValueChange={setSelectedInstitutionId}
          options={availableInstitutions.map((institution) => ({
            label: institution.name,
            value: institution.id,
          }))}
          placeholder={
            availableInstitutions.length === 0
              ? "No institutions left to license"
              : "Select institution"
          }
          searchPlaceholder="Search institutions…"
          emptyText="No institution found."
          disabled={isEditing}
        />

        <NotchedSelectField
          label="Choose License Type"
          labelClassName="bg-popover"
          value={licenseType}
          onValueChange={(value) => setLicenseType(value as LicenseType)}
          options={LICENSE_TYPE_OPTIONS}
        />

        <NotchedDateField
          label="Set License expiring Date"
          labelClassName="bg-popover"
          value={expiringAt}
          onValueChange={setExpiringAt}
          disabled={licenseType === "Basic"}
        />

        <div className="space-y-2">
          <NotchedField
            label="License key"
            labelClassName="bg-popover"
            placeholder="e.g. BCO17-23671-23777-899C0"
            {...register("licenseKey")}
          />
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleGenerateKey}
              className="cursor-pointer rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Generate key
            </button>
            <button
              type="button"
              onClick={handleClearKey}
              className="cursor-pointer text-xs font-medium text-destructive transition-colors hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
      </form>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="submit"
          form="license-form"
          disabled={formState.isSubmitting || saveLicense.isPending}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Submit
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
