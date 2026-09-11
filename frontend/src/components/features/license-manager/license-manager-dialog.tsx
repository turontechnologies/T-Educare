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
  NotchedComboboxField,
  NotchedDateField,
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import { generateKey } from "@/lib/mock-generators";
import { notifyInstitution, notifyPlatform } from "@/lib/notify";
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
  const updateInstitution = useInstitutionsStore(
    (state) => state.updateInstitution,
  );

  const isEditing = !!institutionId;
  const initialInstitution = institutionId
    ? institutions.find((institution) => institution.id === institutionId)
    : undefined;

  // "Create New License" only offers institutions that don't have one yet
  // — an already-licensed institution is edited by clicking its name in
  // the table instead, not re-selected from here.
  const availableInstitutions = useMemo(() => {
    const unlicensed = institutions.filter(
      (institution) => !institution.archivedAt && !institution.licenseKey,
    );
    return initialInstitution
      ? [initialInstitution, ...unlicensed]
      : unlicensed;
  }, [institutions, initialInstitution]);

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

  const onSubmit = (values: LicenseFormValues) => {
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

    const institution = institutions.find(
      (i) => i.id === selectedInstitutionId,
    );
    if (!institution) return;

    updateInstitution(institution.id, {
      licenseType,
      expiringAt:
        licenseType !== "Basic" ? new Date(expiringAt).toISOString() : null,
      licenseKey: values.licenseKey.trim(),
      licenseIssuedAt: institution.licenseIssuedAt ?? new Date().toISOString(),
    });
    toast.success(`License saved for ${institution.name}`);
    notifyPlatform(
      "License saved",
      `${institution.name}'s license was set to ${licenseType}.`,
      "/super-admin/license-manager",
    );
    notifyInstitution(
      institution.id,
      "Your license was updated",
      `Your institution's license is now ${licenseType}.`,
    );
    onDone();
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
