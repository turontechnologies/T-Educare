"use client";

import { useState } from "react";
import { ArrowRight, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NotchedDateField,
  NotchedField,
  NotchedSelectField,
  NotchedTimeField,
} from "@/components/shared/notched-field";
import {
  useAnnouncementTargetOptions,
  useCreateAnnouncement,
  useUpdateAnnouncement,
} from "@/hooks/use-announcements";
import { useUploadFile } from "@/hooks/use-upload";
import type { AttachmentPayload } from "@/services/announcement.service";
import type {
  Announcement,
  AnnouncementTargetScope,
} from "@/types/announcement";

const SCOPE_OPTIONS: { label: string; value: AnnouncementTargetScope }[] = [
  { label: "School-wide", value: "SCHOOL_WIDE" },
  { label: "Students", value: "STUDENTS" },
  { label: "Staff", value: "STAFF" },
  { label: "Hostel residents", value: "HOSTEL_RESIDENTS" },
];

interface AnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing draft/scheduled announcement. */
  announcement?: Announcement;
}

export function AnnouncementDialog({
  open,
  onOpenChange,
  announcement,
}: AnnouncementDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-lg gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Create Announcement
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {open && (
          <AnnouncementForm
            key={announcement?.id ?? "new"}
            announcement={announcement}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface PendingAttachment extends AttachmentPayload {
  key: string;
}

function toDateValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function AnnouncementForm({
  announcement,
  onDone,
}: {
  announcement?: Announcement;
  onDone: () => void;
}) {
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const uploadFile = useUploadFile();

  const [headline, setHeadline] = useState(announcement?.headline ?? "");
  const [body, setBody] = useState(announcement?.body ?? "");
  const [sendViaApp, setSendViaApp] = useState(
    announcement?.sendViaApp ?? true,
  );
  const [sendViaEmail, setSendViaEmail] = useState(
    announcement?.sendViaEmail ?? false,
  );
  const [targetScope, setTargetScope] = useState<AnnouncementTargetScope | "">(
    announcement?.targetScope ?? "",
  );
  const [targetValue, setTargetValue] = useState(
    announcement?.targetValue ?? "",
  );
  const [attachments, setAttachments] = useState<PendingAttachment[]>(
    announcement?.attachments.map((a) => ({
      key: a.id,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
      fileSizeBytes: a.fileSizeBytes,
    })) ?? [],
  );
  const [scheduleEnabled, setScheduleEnabled] = useState(
    !!announcement?.scheduledFor,
  );
  const [scheduledDate, setScheduledDate] = useState(
    toDateValue(announcement?.scheduledFor ?? null),
  );
  const [scheduledTime, setScheduledTime] = useState(
    toTimeValue(announcement?.scheduledFor ?? null),
  );
  const [submitting, setSubmitting] = useState(false);

  const { data: targetOptions = [] } =
    useAnnouncementTargetOptions(targetScope);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const { url } = await uploadFile.mutateAsync(file);
      setAttachments((prev) => [
        ...prev,
        {
          key: `${Date.now()}`,
          fileName: file.name,
          fileUrl: url,
          fileSizeBytes: file.size,
        },
      ]);
    } catch {
      toast.error("Failed to upload attachment. Please try again.");
    }
  };

  const removeAttachment = (key: string) => {
    setAttachments((prev) => prev.filter((a) => a.key !== key));
  };

  const submit = async (action: "SEND" | "SCHEDULE" | "DRAFT") => {
    if (!headline.trim() || !body.trim()) {
      toast.error("Headline and body are required");
      return;
    }
    if (!sendViaApp && !sendViaEmail) {
      toast.error("Select at least one channel (App or Email)");
      return;
    }
    if (!targetScope) {
      toast.error("Select a target scope");
      return;
    }
    if (targetScope !== "SCHOOL_WIDE" && !targetValue) {
      toast.error("Select a target");
      return;
    }
    if (action === "SCHEDULE" && (!scheduledDate || !scheduledTime)) {
      toast.error("Select a date and time to schedule for");
      return;
    }

    const payload = {
      headline: headline.trim(),
      body: body.trim(),
      sendViaApp,
      sendViaEmail,
      targetScope,
      targetValue: targetScope === "SCHOOL_WIDE" ? undefined : targetValue,
      attachments: attachments.map(({ fileName, fileUrl, fileSizeBytes }) => ({
        fileName,
        fileUrl,
        fileSizeBytes,
      })),
      action,
      scheduledFor:
        action === "SCHEDULE"
          ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
          : undefined,
    };

    setSubmitting(true);
    try {
      if (announcement) {
        await updateAnnouncement.mutateAsync({ id: announcement.id, payload });
      } else {
        await createAnnouncement.mutateAsync(payload);
      }
      toast.success(
        action === "SEND"
          ? "Announcement sent"
          : action === "SCHEDULE"
            ? "Announcement scheduled"
            : "Draft saved",
      );
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save announcement",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
        <NotchedField
          label="Headline"
          labelClassName="bg-popover"
          value={headline}
          onChange={(event) => setHeadline(event.target.value)}
        />

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Body</Label>
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-foreground">
            Attachment:{" "}
            <span className="text-muted-foreground">
              maximum size: 30mb per file
            </span>
          </p>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.key}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2 truncate text-foreground">
                  <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                  {attachment.fileName}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.key)}
                  className="cursor-pointer text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-secondary hover:underline">
            <Paperclip className="size-3.5" />
            {uploadFile.isPending ? "Uploading…" : "Add attachment"}
            <input
              type="file"
              onChange={handleFileChange}
              disabled={uploadFile.isPending}
              className="sr-only"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <NotchedSelectField
            label="Target Scope"
            labelClassName="bg-popover"
            value={targetScope}
            onValueChange={(value) => {
              setTargetScope(value as AnnouncementTargetScope);
              setTargetValue("");
            }}
            options={SCOPE_OPTIONS}
            placeholder="Select"
          />
          <NotchedSelectField
            label="Target"
            labelClassName="bg-popover"
            value={targetValue}
            onValueChange={setTargetValue}
            options={targetOptions}
            placeholder="Select"
            disabled={!targetScope}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Send via</Label>
          <div className="flex items-center gap-5">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
              <Checkbox
                checked={sendViaApp}
                onCheckedChange={(checked) => setSendViaApp(checked === true)}
              />
              App
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
              <Checkbox
                checked={sendViaEmail}
                onCheckedChange={(checked) => setSendViaEmail(checked === true)}
              />
              Email
            </label>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
          <Checkbox
            checked={scheduleEnabled}
            onCheckedChange={(checked) => setScheduleEnabled(checked === true)}
          />
          Schedule for later?
        </label>

        {scheduleEnabled && (
          <div className="grid grid-cols-2 gap-4">
            <NotchedDateField
              label="Date"
              labelClassName="bg-popover"
              value={scheduledDate}
              onValueChange={setScheduledDate}
            />
            <NotchedTimeField
              label="Time"
              labelClassName="bg-popover"
              value={scheduledTime}
              onValueChange={setScheduledTime}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={() => submit("DRAFT")}
          className="rounded-full px-5"
        >
          Save draft
        </Button>
        <Button
          type="button"
          disabled={submitting}
          onClick={() => submit(scheduleEnabled ? "SCHEDULE" : "SEND")}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          {scheduleEnabled ? "Schedule" : "Send"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
