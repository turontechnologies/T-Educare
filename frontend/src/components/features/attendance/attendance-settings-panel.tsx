"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  NotchedField,
  NotchedTimeField,
} from "@/components/shared/notched-field";
import { cn } from "@/lib/utils";
import {
  useAttendanceSettings,
  useUpdateAttendanceSettings,
} from "@/hooks/use-attendance";
import { WORKDAY_LABELS } from "@/lib/attendance";
import {
  ATTENDANCE_WORKDAYS,
  type AttendanceWorkday,
} from "@/types/attendance";

export function AttendanceSettingsPanel() {
  const { data: settings } = useAttendanceSettings();
  const updateSettings = useUpdateAttendanceSettings();

  const [resumptionTime, setResumptionTime] = useState("08:00");
  const [closingTime, setClosingTime] = useState("17:00");
  const [gracePeriod, setGracePeriod] = useState("15");
  const [workdays, setWorkdays] = useState<Set<AttendanceWorkday>>(
    new Set(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]),
  );

  // Settings load async on first mount — seed the local draft from the
  // real values as soon as they arrive. Adjusting state during render
  // (rather than in a useEffect) avoids the extra commit-then-rerender
  // pass, same pattern as registration/page.tsx's `lastSelectionKey`.
  const [syncedAt, setSyncedAt] = useState<string | undefined>();
  if (settings && settings.updatedAt !== syncedAt) {
    setSyncedAt(settings.updatedAt);
    setResumptionTime(settings.resumptionTime);
    setClosingTime(settings.closingTime);
    setGracePeriod(String(settings.gracePeriodMinutes));
    setWorkdays(new Set(settings.workdays));
  }

  const toggleWorkday = (day: AttendanceWorkday) => {
    setWorkdays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const handleSave = async () => {
    const grace = Number(gracePeriod);
    if (!resumptionTime || !closingTime) {
      toast.error("Set both a resumption and closing time");
      return;
    }
    if (!Number.isFinite(grace) || grace < 0 || grace > 180) {
      toast.error("Grace period must be between 0 and 180 minutes");
      return;
    }
    if (workdays.size === 0) {
      toast.error("Select at least one workday");
      return;
    }

    try {
      await updateSettings.mutateAsync({
        resumptionTime,
        closingTime,
        gracePeriodMinutes: grace,
        workdays: Array.from(workdays),
      });
      toast.success("Attendance settings saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings",
      );
    }
  };

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both max-w-2xl duration-500">
      <CardHeader>
        <p className="text-sm font-medium text-foreground">
          Resumption &amp; Closing Time
        </p>
        <p className="text-xs text-muted-foreground">
          Staff clocking in after the grace period are marked late. These times
          apply across every clock-in device on this institution.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <NotchedTimeField
            label="Resumption Time"
            value={resumptionTime}
            onValueChange={setResumptionTime}
          />
          <NotchedTimeField
            label="Closing Time"
            value={closingTime}
            onValueChange={setClosingTime}
          />
          <NotchedField
            label="Grace Period (minutes)"
            type="number"
            min={0}
            max={180}
            value={gracePeriod}
            onChange={(event) => setGracePeriod(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Workdays</Label>
          <div className="flex flex-wrap gap-2">
            {ATTENDANCE_WORKDAYS.map((day) => {
              const active = workdays.has(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWorkday(day)}
                  className={cn(
                    "cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-secondary bg-secondary/10 text-secondary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {WORKDAY_LABELS[day]}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          type="button"
          className="gap-2 rounded-full px-6"
          disabled={updateSettings.isPending}
          onClick={handleSave}
        >
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
