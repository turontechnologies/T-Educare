export type AnnouncementTargetScope =
  "SCHOOL_WIDE" | "STUDENTS" | "STAFF" | "HOSTEL_RESIDENTS";

export type AnnouncementStatus = "DRAFT" | "SCHEDULED" | "SENT";

export interface AnnouncementAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
}

/** Enriched — matches the backend's `AnnouncementResponse` so the feed never needs a separate lookup. */
export interface Announcement {
  id: string;
  headline: string;
  body: string;
  sendViaApp: boolean;
  sendViaEmail: boolean;
  targetScope: AnnouncementTargetScope;
  targetValue: string | null;
  targetLabel: string;
  status: AnnouncementStatus;
  scheduledFor: string | null;
  sentAt: string | null;
  createdByName: string;
  attachments: AnnouncementAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementTargetOption {
  value: string;
  label: string;
}
