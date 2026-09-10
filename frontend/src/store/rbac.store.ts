import { create } from "zustand";
import { persist } from "zustand/middleware";
import { collectAllMenuKeys, INSTITUTION_NAV } from "@/config/nav";
import type { ManagedUser, Role } from "@/types/rbac";

const ALL_MENU_KEYS = collectAllMenuKeys(INSTITUTION_NAV);

/** The institution's primary account — full access, not editable/deletable. */
export const ROOT_ADMIN_ROLE_ID = "role-institution-admin";

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEEDED_ROLES: Role[] = [
  {
    id: ROOT_ADMIN_ROLE_ID,
    name: "Institution Admin",
    description:
      "Full access to every module. Assigned to the institution's primary account.",
    menuKeys: ALL_MENU_KEYS,
    isSystem: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "role-front-desk",
    name: "Front Desk Officer",
    description: "Handles day-to-day registration and student records only.",
    menuKeys: ["dashboard", "registration", "students"],
    createdAt: "2026-01-05T00:00:00.000Z",
  },
];

const SEEDED_USERS: ManagedUser[] = [
  {
    id: "user-christian-smart",
    name: "Christian Smart",
    email: "christian.smart@turontech.com",
    roleId: ROOT_ADMIN_ROLE_ID,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "user-amara-bello",
    name: "Amara Bello",
    email: "amara.bello@turontech.com",
    roleId: "role-front-desk",
    status: "active",
    createdAt: "2026-01-06T00:00:00.000Z",
  },
];

interface RbacState {
  roles: Role[];
  users: ManagedUser[];
  createRole: (role: Omit<Role, "id" | "createdAt" | "isSystem">) => Role;
  updateRole: (
    id: string,
    patch: Partial<Omit<Role, "id" | "isSystem" | "createdAt">>,
  ) => void;
  deleteRole: (id: string) => void;
  createUser: (user: Omit<ManagedUser, "id" | "createdAt">) => ManagedUser;
  updateUser: (id: string, patch: Partial<Omit<ManagedUser, "id">>) => void;
  deleteUser: (id: string) => void;
  /** null = unrestricted (system role, or no role assigned at all — e.g. the root admin). */
  getMenuKeysForRole: (roleId: string | undefined) => string[] | null;
}

export const useRbacStore = create<RbacState>()(
  persist(
    (set, get) => ({
      roles: SEEDED_ROLES,
      users: SEEDED_USERS,

      createRole: (role) => {
        const newRole: Role = {
          ...role,
          id: makeId("role"),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ roles: [...state.roles, newRole] }));
        return newRole;
      },

      updateRole: (id, patch) => {
        set((state) => ({
          roles: state.roles.map((role) =>
            role.id === id ? { ...role, ...patch } : role,
          ),
        }));
      },

      deleteRole: (id) => {
        set((state) => ({
          roles: state.roles.filter((role) => role.id !== id),
        }));
      },

      createUser: (user) => {
        const newUser: ManagedUser = {
          ...user,
          id: makeId("user"),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ users: [...state.users, newUser] }));
        return newUser;
      },

      updateUser: (id, patch) => {
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id ? { ...user, ...patch } : user,
          ),
        }));
      },

      deleteUser: (id) => {
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
        }));
      },

      getMenuKeysForRole: (roleId) => {
        if (!roleId) return null;
        const role = get().roles.find((r) => r.id === roleId);
        if (!role || role.isSystem) return null;
        return role.menuKeys;
      },
    }),
    { name: "t-educare-rbac" },
  ),
);
