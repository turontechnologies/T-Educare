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
import {
  NotchedDateField,
  NotchedField,
} from "@/components/shared/notched-field";
import { Switch } from "@/components/ui/switch";
import {
  useRegistrationSettings,
  useUpdateRegistrationSettings,
} from "@/hooks/use-registration";
import type { RegistrationSettings } from "@/types/registration";

/** Date-only granularity, deliberately — a registration window is "opens Jan 1, closes Jan 31", not a specific time of day. `opensAt` is the start of that day; `closesAt`/`graceEndsAt` are treated as the END of that day (23:59:59), so "closes Jan 31" means registration still works through Jan 31, not cuts off at its midnight start. */
function toStartOfDayIso(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}
function toEndOfDayIso(date: string): string {
  return new Date(`${date}T23:59:59.999Z`).toISOString();
}
function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

interface RegistrationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Institution-configurable policy (API_CONTRACT.md §7.12) — the "make it flexible based on what the institution admin want" requirement: whether a carryover must be cleared before new courses, and the total-unit cap per semester. */
export function RegistrationSettingsDialog({
  open,
  onOpenChange,
}: RegistrationSettingsDialogProps) {
  const { data: settings } = useRegistrationSettings({ enabled: open });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-lg gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Registration Settings
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed by the loaded settings so the form's initial state is never stuck on stale defaults from before the fetch resolved — same convention every dialog in this app uses instead of a useEffect sync. */}
        {open && settings && (
          <RegistrationSettingsForm
            key={`${settings.requireCarryoverClearance}-${settings.maxUnitsPerSemester}-${settings.registrationOpensAt}-${settings.registrationClosesAt}-${settings.registrationGracePeriodEndsAt}`}
            settings={settings}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RegistrationSettingsForm({
  settings,
  onDone,
}: {
  settings: RegistrationSettings;
  onDone: () => void;
}) {
  const updateSettings = useUpdateRegistrationSettings();
  const [requireCarryoverClearance, setRequireCarryoverClearance] = useState(
    settings.requireCarryoverClearance,
  );
  const [maxUnitsPerSemester, setMaxUnitsPerSemester] = useState(
    String(settings.maxUnitsPerSemester),
  );
  const [opensAt, setOpensAt] = useState(
    toDateInputValue(settings.registrationOpensAt),
  );
  const [closesAt, setClosesAt] = useState(
    toDateInputValue(settings.registrationClosesAt),
  );
  const [graceEndsAt, setGraceEndsAt] = useState(
    toDateInputValue(settings.registrationGracePeriodEndsAt),
  );

  const handleSave = async () => {
    const parsed = Number(maxUnitsPerSemester);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      toast.error("Maximum units must be a positive whole number");
      return;
    }
    if (opensAt && closesAt && opensAt > closesAt) {
      toast.error("Opens date can't be after the closes date");
      return;
    }
    try {
      await updateSettings.mutateAsync({
        requireCarryoverClearance,
        maxUnitsPerSemester: parsed,
        registrationOpensAt: opensAt ? toStartOfDayIso(opensAt) : "",
        registrationClosesAt: closesAt ? toEndOfDayIso(closesAt) : "",
        registrationGracePeriodEndsAt: graceEndsAt
          ? toEndOfDayIso(graceEndsAt)
          : "",
      });
      toast.success("Registration settings saved");
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings",
      );
    }
  };

  return (
    <>
      <div className="space-y-5 p-6">
        <label className="flex cursor-pointer items-center justify-between rounded-md border border-border p-3.5">
          <span className="pr-4 text-sm">
            <span className="block font-medium text-foreground">
              Require carryover clearance
            </span>
            <span className="block text-xs text-muted-foreground">
              A student must register for outstanding carryover courses before
              new ones are accepted.
            </span>
          </span>
          <Switch
            checked={requireCarryoverClearance}
            onCheckedChange={setRequireCarryoverClearance}
          />
        </label>

        <NotchedField
          label="Maximum units per semester"
          labelClassName="bg-popover"
          type="number"
          min={1}
          value={maxUnitsPerSemester}
          onChange={(event) => setMaxUnitsPerSemester(event.target.value)}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">
            Registration window
          </p>
          <p className="mb-3 text-xs text-muted-foreground">
            Leave both blank for unrestricted registration. To reopen after
            closing, just set a later closes date — as many times as you need.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <NotchedDateField
              label="Opens"
              labelClassName="bg-popover"
              value={opensAt}
              onValueChange={setOpensAt}
            />
            <NotchedDateField
              label="Closes"
              labelClassName="bg-popover"
              value={closesAt}
              onValueChange={setClosesAt}
            />
          </div>
        </div>

        <NotchedDateField
          label="Grace period until (optional)"
          labelClassName="bg-popover"
          value={graceEndsAt}
          onValueChange={setGraceEndsAt}
          placeholder="No grace period set"
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
