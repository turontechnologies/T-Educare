"use client";

import { useState } from "react";
import { Download, FileText, Mail, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Announcement } from "@/types/announcement";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AnnouncementCardProps {
  announcement: Announcement;
  actions?: React.ReactNode;
}

export function AnnouncementCard({
  announcement,
  actions,
}: AnnouncementCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = announcement.body.length > 260;
  const bodyPreview =
    !expanded && isLong
      ? `${announcement.body.slice(0, 260)}…`
      : announcement.body;

  const timeLabel =
    announcement.status === "SENT"
      ? announcement.sentAt
        ? formatDateTime(announcement.sentAt)
        : ""
      : announcement.status === "SCHEDULED"
        ? announcement.scheduledFor
          ? `Goes out ${formatDateTime(announcement.scheduledFor)}`
          : ""
        : `Last edited ${formatDateTime(announcement.updatedAt)}`;

  const byLabel =
    announcement.status === "SENT"
      ? "Sent by"
      : announcement.status === "SCHEDULED"
        ? "Scheduled by"
        : "Drafted by";

  return (
    <div className="animate-in fade-in rounded-lg border border-border bg-card p-5 duration-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">{timeLabel}</p>
          <div className="flex items-center gap-1.5">
            {announcement.sendViaApp && (
              <Badge className="gap-1 bg-emerald-500/10 text-emerald-600">
                <Smartphone className="size-3" />
                App
              </Badge>
            )}
            {announcement.sendViaEmail && (
              <Badge className="gap-1 bg-secondary/10 text-secondary">
                <Mail className="size-3" />
                Email
              </Badge>
            )}
          </div>
        </div>
        {actions}
      </div>

      <h3 className="mt-3 font-semibold text-foreground">
        {announcement.headline}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {byLabel} {announcement.createdByName}
      </p>

      <p className="mt-3 whitespace-pre-line text-sm text-foreground">
        {bodyPreview}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1 cursor-pointer text-sm font-medium text-secondary hover:underline"
        >
          {expanded ? "Show less" : "Show full message"}
        </button>
      )}

      {announcement.attachments.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground">
            {announcement.attachments.length} attachment
            {announcement.attachments.length === 1 ? "" : "s"}
          </p>
          {announcement.attachments.map((attachment) => (
            <a
              key={attachment.id}
              href={attachment.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-secondary"
            >
              <span className="flex items-center gap-2 truncate text-foreground">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{attachment.fileName}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatSize(attachment.fileSizeBytes)}
                </span>
              </span>
              <Download className="size-4 shrink-0 text-muted-foreground" />
            </a>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {announcement.status === "SENT" ? "Sent to" : "Sending to"}
        </span>
        <Badge className="bg-muted text-muted-foreground">
          {announcement.targetLabel}
        </Badge>
      </div>
    </div>
  );
}
