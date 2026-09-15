export type StaffCategory = "Academic Staff" | "Non-Academic Staff";

export interface StaffDesignation {
  id: string;
  /** e.g. "Lecturer", "HOD" — also used as the display label wherever a designation is picked elsewhere (School Head, Faculty Dean, Staff role/designation). */
  name: string;
  description: string;
  category: StaffCategory;
  createdAt: string;
  /** Nullable — soft-delete, same convention as every other admin table. */
  archivedAt: string | null;
}
