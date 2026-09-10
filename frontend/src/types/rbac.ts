export interface Role {
  id: string;
  name: string;
  description: string;
  /** Menu-item keys (see src/config/nav.ts) this role can see and access. */
  menuKeys: string[];
  /** System roles (the institution's root admin) can't be edited or deleted, and always resolve to unrestricted access regardless of `menuKeys`. */
  isSystem?: boolean;
  createdAt: string;
}

export type ManagedUserStatus = "active" | "suspended";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: ManagedUserStatus;
  createdAt: string;
}
