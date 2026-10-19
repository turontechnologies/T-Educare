"use client";

import { useState } from "react";
import { endOfWeek, format, startOfWeek, subDays, subWeeks } from "date-fns";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotchedDateField } from "@/components/shared/notched-field";
import type { AttendanceExportFormat } from "@/services/attendance.service";
import { useExportAttendance } from "@/hooks/use-attendance";
import { todayIsoDate } from "@/lib/attendance";

interface AttendanceExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ISO = "yyyy-MM-dd";

function preset(key: string): { from: string; to: string } {
  const today = new Date();
  switch (key) {
    case "today":
      return { from: todayIsoDate(), to: todayIsoDate() };
    case "yesterday": {
      const y = format(subDays(today, 1), ISO);
      return { from: y, to: y };
    }
    case "this-week":
      return {
        from: format(startOfWeek(today, { weekStartsOn: 1 }), ISO),
        to: todayIsoDate(),
      };
    case "last-week": {
      const lastWeekDay = subWeeks(today, 1);
      return {
        from: format(startOfWeek(lastWeekDay, { weekStartsOn: 1 }), ISO),
        to: format(endOfWeek(lastWeekDay, { weekStartsOn: 1 }), ISO),
      };
    }
    case "last-7-days":
      return { from: format(subDays(today, 6), ISO), to: todayIsoDate() };
    case "last-30-days":
      return { from: format(subDays(today, 29), ISO), to: todayIsoDate() };
    default:
      return { from: todayIsoDate(), to: todayIsoDate() };
  }
}

const PRESETS: { label: string; value: string }[] = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This week", value: "this-week" },
  { label: "Last week", value: "last-week" },
  { label: "Last 7 days", value: "last-7-days" },
  { label: "Last 30 days", value: "last-30-days" },
  { label: "Custom range", value: "custom" },
];

const FORMATS: { label: string; value: AttendanceExportFormat }[] = [
  { label: "CSV (spreadsheet-friendly)", value: "csv" },
  { label: "Excel (.xlsx)", value: "xlsx" },
  { label: "PDF (printable report)", value: "pdf" },
];

/** Lets an admin pick exactly which days of clock-event history to export, and in which format, before anything downloads — replaces the earlier hardcoded "always last 30 days as CSV" behavior. */
export function AttendanceExportDialog({
  open,
  onOpenChange,
}: AttendanceExportDialogProps) {
  const exportAttendance = useExportAttendance();
  const [presetKey, setPresetKey] = useState("last-7-days");
  const [customFrom, setCustomFrom] = useState(
    format(subDays(new Date(), 6), ISO),
  );
  const [customTo, setCustomTo] = useState(todayIsoDate());
  const [exportFormat, setExportFormat] =
    useState<AttendanceExportFormat>("csv");

  const isCustom = presetKey === "custom";
  const range = isCustom
    ? { from: customFrom, to: customTo }
    : preset(presetKey);

  const handleExport = async () => {
    if (range.to < range.from) {
      toast.error("The end date can't be before the start date");
      return;
    }
    try {
      const blob = await exportAttendance.mutateAsync({
        from: range.from,
        to: range.to,
        format: exportFormat,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance-${range.from}-to-${range.to}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Attendance exported");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to export attendance",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-lg gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Export Attendance
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer text-white/80 transition-colors hover:text-white"
          >
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <Label className="mb-1.5 block text-sm text-muted-foreground">
              Date range
            </Label>
            <Select
              value={presetKey}
              onValueChange={(value) => value && setPresetKey(value)}
              items={PRESETS}
            >
              <SelectTrigger className="h-11 w-full justify-between rounded-md text-base font-normal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCustom ? (
            <div className="grid grid-cols-2 gap-3">
              <NotchedDateField
                label="From"
                value={customFrom}
                onValueChange={setCustomFrom}
              />
              <NotchedDateField
                label="To"
                value={customTo}
                onValueChange={setCustomTo}
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {range.from === range.to
                ? range.from
                : `${range.from} – ${range.to}`}
            </p>
          )}

          <div>
            <Label className="mb-1.5 block text-sm text-muted-foreground">
              Format
            </Label>
            <Select
              value={exportFormat}
              onValueChange={(value) =>
                value && setExportFormat(value as AttendanceExportFormat)
              }
              items={FORMATS}
            >
              <SelectTrigger className="h-11 w-full justify-between rounded-md text-base font-normal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <Button
            type="button"
            disabled={exportAttendance.isPending}
            onClick={handleExport}
            className="rounded-md"
          >
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
