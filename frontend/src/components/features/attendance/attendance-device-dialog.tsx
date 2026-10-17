"use client";

import { useState } from "react";
import { AlertTriangle, Check, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { NotchedField } from "@/components/shared/notched-field";
import { useCreateAttendanceDevice } from "@/hooks/use-attendance";
import type { AttendanceDeviceCreated } from "@/types/attendance";

interface AttendanceDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Registers a new biometric/clock-in device. The API key is generated
 * server-side and shown exactly once on success — it's BCrypt-hashed at
 * rest and can never be retrieved again, same convention as a generated
 * user password, but with no "reset" escape hatch: losing it means
 * registering a new device.
 */
export function AttendanceDeviceDialog({
  open,
  onOpenChange,
}: AttendanceDeviceDialogProps) {
  const [created, setCreated] = useState<AttendanceDeviceCreated | undefined>();

  const handleClose = (next: boolean) => {
    onOpenChange(next);
    if (!next) setCreated(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {created ? "Device Registered" : "Register Attendance Device"}
          </DialogTitle>
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="cursor-pointer text-white/80 transition-colors hover:text-white"
          >
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {open &&
          (created ? (
            <KeyReveal created={created} onDone={() => handleClose(false)} />
          ) : (
            <RegisterForm onCreated={setCreated} />
          ))}
      </DialogContent>
    </Dialog>
  );
}

function RegisterForm({
  onCreated,
}: {
  onCreated: (created: AttendanceDeviceCreated) => void;
}) {
  const createDevice = useCreateAttendanceDevice();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Enter a device name");
      return;
    }
    try {
      const result = await createDevice.mutateAsync({
        name: name.trim(),
        location: location.trim() || undefined,
      });
      onCreated(result);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to register device",
      );
    }
  };

  return (
    <div className="space-y-5 p-6">
      <p className="text-xs text-muted-foreground">
        Give the biometric device a name and location. You&apos;ll get an API
        key to configure on the device itself — it clocks staff in and out by
        calling this app directly, no admin login required.
      </p>

      <NotchedField
        label="Device Name"
        labelClassName="bg-popover"
        placeholder="e.g. Main Gate Biometric"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <NotchedField
        label="Location (optional)"
        labelClassName="bg-popover"
        placeholder="e.g. Main Entrance"
        value={location}
        onChange={(event) => setLocation(event.target.value)}
      />

      <Button
        type="button"
        className="w-full gap-2 rounded-full"
        disabled={createDevice.isPending}
        onClick={handleSubmit}
      >
        Register Device
      </Button>
    </div>
  );
}

function KeyReveal({
  created,
  onDone,
}: {
  created: AttendanceDeviceCreated;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(created.apiKey);
      setCopied(true);
      toast.success("API key copied");
    } catch {
      toast.error("Couldn't copy automatically — select and copy it manually");
    }
  };

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <p className="text-xs font-medium text-amber-700">
          Copy this API key now — for security, it will never be shown again. If
          you lose it, you&apos;ll need to register a new device.
        </p>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">
          {created.device.name}
        </p>
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2.5">
          <code className="flex-1 overflow-x-auto font-mono text-sm text-foreground">
            {created.apiKey}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy API key"
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-medium text-secondary transition-colors hover:bg-secondary/10"
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <Button
        type="button"
        className="w-full gap-2 rounded-full"
        disabled={!copied}
        onClick={onDone}
      >
        {copied ? "Done" : "Copy the key to continue"}
      </Button>
    </div>
  );
}
