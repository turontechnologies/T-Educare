export type InstitutionStatus = "active" | "inactive";
export type LicenseType = "Basic" | "Standard" | "Premium";

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
  /** Keys from `src/config/modules.ts` that are activated for this institution — set via the Modules "Link New Institution" flow. Empty until first linked. */
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
  createdAt: string;
  /** Soft-delete — archived institutions are hidden from the main list but never destroyed. ISO timestamp, or null if active. */
  archivedAt: string | null;
}
