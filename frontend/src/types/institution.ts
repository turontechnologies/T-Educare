export type InstitutionStatus = "active" | "inactive";
export type LicenseType = "Freemium" | "Premium";

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
  /** ISO date, or null for a Freemium institution with no expiry. */
  expiringAt: string | null;
  tokenKey: string;
  status: InstitutionStatus;
  createdAt: string;
  /** Soft-delete — archived institutions are hidden from the main list but never destroyed. ISO timestamp, or null if active. */
  archivedAt: string | null;
}
