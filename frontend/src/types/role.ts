export interface Role {
  id: string;
  institutionId: string;
  name: string;
  description: string | null;
  /** Real nav keys (see config/nav.ts) accounts assigned this role are limited to. */
  menuKeys: string[];
  createdAt: string;
  /** Soft-delete — archived roles keep granting access to any account still assigned them, but drop out of the assignable list. */
  archivedAt: string | null;
}
