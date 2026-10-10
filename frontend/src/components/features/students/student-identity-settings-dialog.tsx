"use client";

import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { NotchedSelectField } from "@/components/shared/notched-field";
import {
  useStudentIdentitySettings,
  useUpdateStudentIdentitySettings,
} from "@/hooks/use-student-identity-settings";
import type {
  PreStudentIdentifierPreference,
  StudentIdentitySettings,
} from "@/types/student";

const PREFERENCE_OPTIONS: {
  label: string;
  value: PreStudentIdentifierPreference;
}[] = [
  {
    label: "Auto-generated Pre-ID (e.g. PRE-7505A3A3)",
    value: "PRE_ADMISSION_ID",
  },
  { label: "JAMB Registration Number", value: "JAMB_REG_NUMBER" },
];

interface StudentIdentitySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Institution-configurable policy: which identifier the UI shows as "primary" for a pre-student (no matric number yet) before admission is finalized. Both values always exist on the record regardless of this setting. */
export function StudentIdentitySettingsDialog({
  open,
  onOpenChange,
}: StudentIdentitySettingsDialogProps) {
  const { data: settings } = useStudentIdentitySettings({ enabled: open });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Pre-Student Identification
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed by the loaded setting so the form's initial state is never stuck on a stale default — same convention as registration-settings-dialog.tsx. */}
        {open && settings && (
          <StudentIdentitySettingsForm
            key={settings.preStudentIdentifierPreference}
            settings={settings}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function StudentIdentitySettingsForm({
  settings,
  onDone,
}: {
  settings: StudentIdentitySettings;
  onDone: () => void;
}) {
  const updateSettings = useUpdateStudentIdentitySettings();
  const [preference, setPreference] = useState<PreStudentIdentifierPreference>(
    settings.preStudentIdentifierPreference,
  );

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        preStudentIdentifierPreference: preference,
      });
      toast.success("Pre-student identification setting saved");
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save setting",
      );
    }
  };

  return (
    <>
      <div className="space-y-5 p-6">
        <p className="text-xs text-muted-foreground">
          Before a student is assigned a matric number, which identifier should
          the school primarily use to refer to them? Both are always recorded
          regardless of this choice.
        </p>
        <NotchedSelectField
          label="Primary identifier for pre-students"
          labelClassName="bg-popover"
          value={preference}
          onValueChange={(value) =>
            setPreference(value as PreStudentIdentifierPreference)
          }
          options={PREFERENCE_OPTIONS}
        />
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          disabled={updateSettings.isPending}
          onClick={handleSave}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Save
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
