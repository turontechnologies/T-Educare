export type InstitutionStatus = "active" | "inactive";
export type LicenseType = "Basic" | "Standard" | "Premium";
/** Separate concern from `InstitutionStatus` above (the manual super-admin on/off switch) — this tracks standing against payment/renewal obligations instead. */
export type LicenseStatus = "ACTIVE" | "GRACE_PERIOD" | "SUSPENDED";
export type LicenseEventType = "GRACE_STARTED" | "SUSPENDED" | "RENEWED";

export interface Institution {
  id: string;
  /** Short display code shown in the table (e.g. "001") — not the same as `id`, which is the real record key. */
  code: string;
  name: string;
  institutionType: string;
  address: string;
  city: string;
  /** e.g. "Nigeria - Ogun State" */
  countryState: string;
  principalName: string;
  principalEmail: string;
  principalPhone: string;
  /** Primary admin — the person this institution's root login belongs to. */
  adminUser: string;
  adminEmail: string;
  logoUrl?: string;
  /** Keys from the real module catalog (`GET /modules`, `types/module.ts`) that are activated for this institution — set via the Modules "Link New Institution" flow (`PATCH /institutions/:id/modules`). Empty until first linked. */
  moduleKeys: string[];
  /** ISO timestamp of the last Modules save for this institution, or null if never linked. Drives the "Last Edited" column on `/super-admin/modules`. */
  modulesLastEditedAt: string | null;
  modulesCount: number;
  studentCount: number;
  revenue: number;
  licenseType: LicenseType;
  /** ISO date, or null for a Basic (free-tier) institution with no expiry. */
  expiringAt: string | null;
  /** General institution access token, shown read-only on `/super-admin/license-manager`'s Token column — distinct from `licenseKey` below. */
  tokenKey: string;
  /** This institution's license record's own key, set via `/super-admin/license-manager` — distinct from `tokenKey`. Null until a license record is created. */
  licenseKey: string | null;
  /** ISO timestamp the license record was first created — immutable, doesn't change on later edits (the "Date Created" column on `/super-admin/license-manager`). Null until created. */
  licenseIssuedAt: string | null;
  status: InstitutionStatus;
  /** Standing against payment/renewal obligations — additive and independent of `status` above. Defaults to "ACTIVE". */
  licenseStatus: LicenseStatus;
  /** Set only while licenseStatus is "GRACE_PERIOD" — the scheduled sweep suspends the institution once this passes. Null otherwise. */
  graceEndsAt: string | null;
  createdAt: string;
  /** Soft-delete — archived institutions are hidden from the main list but never destroyed. ISO timestamp, or null if active. */
  archivedAt: string | null;
}

/** One row of the append-only license-status audit log (`GET /institutions/:id/license-events`) — history only, never the source of current state. */
export interface InstitutionLicenseEvent {
  id: string;
  institutionId: string;
  eventType: LicenseEventType;
  reason: string | null;
  /** The calling super admin's id, or "SYSTEM" for the automated grace-period sweep. */
  actorId: string | null;
  graceEndsAtSnapshot: string | null;
  createdAt: string;
}
