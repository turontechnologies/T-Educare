import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generatePassword } from "@/lib/mock-generators";
import type { UserManagerAccount } from "@/types/user-manager";

function makeId() {
  return `um-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEEDED_USER_MANAGERS: UserManagerAccount[] = [
  {
    id: "um-chris-smart",
    code: "001",
    firstName: "Chris",
    otherName: "Oluwakemi",
    lastName: "Smart",
    gender: "Male",
    email: "chrissmart10@gmail.com",
    phone: "08023778912",
    username: "chrissmart10",
    password: "Passw0rd!23",
    institutionName: "Babcock University",
    isPrimaryAdmin: true,
    status: "active",
    createdAt: "2026-03-05T09:00:00.000Z",
    archivedAt: null,
  },
  {
    id: "um-solomon-okafor",
    code: "002",
    firstName: "Solomon",
    otherName: "",
    lastName: "Okafor",
    gender: "Male",
    email: "solomon101@gmail.com",
    phone: "08023110099",
    username: "solomon101",
    password: "M4donn4Adm!n",
    institutionName: "Madonna University",
    isPrimaryAdmin: true,
    status: "active",
    createdAt: "2026-03-03T10:00:00.000Z",
    archivedAt: null,
  },
  {
    id: "um-ngozi-newuser",
    code: "003",
    firstName: "Ngozi",
    otherName: "",
    lastName: "Bello",
    gender: "Female",
    email: "newuser201@yahoo.com",
    phone: "07031770001",
    username: "newuser201",
    password: "YabaTech!01",
    institutionName: "Yaba College of Technology",
    isPrimaryAdmin: false,
    status: "inactive",
    createdAt: "2026-03-03T08:00:00.000Z",
    archivedAt: null,
  },
  {
    id: "um-james-akpo",
    code: "004",
    firstName: "James",
    otherName: "Tunde",
    lastName: "Akpo",
    gender: "Male",
    email: "james.akpo@universityofla.edu.ng",
    phone: "08030000000",
    username: "jamesakpo4",
    password: "Un1lagAdmin!",
    institutionName: "University of Lagos",
    isPrimaryAdmin: true,
    status: "active",
    createdAt: "2026-03-04T12:20:00.000Z",
    archivedAt: null,
  },
  {
    id: "um-bisi-nnamdi",
    code: "005",
    firstName: "Bisi",
    otherName: "",
    lastName: "Nnamdi",
    gender: "Female",
    email: "bisi.nnamdi@bayerouniversi.edu.ng",
    phone: "08038641969",
    username: "bisinnamdi5",
    password: "BukAdmin!23",
    institutionName: "Bayero University Kano",
    isPrimaryAdmin: false,
    status: "active",
    createdAt: "2026-03-05T14:10:00.000Z",
    archivedAt: null,
  },
  {
    id: "um-david-okafor",
    code: "006",
    firstName: "David",
    otherName: "Chinedu",
    lastName: "Okafor",
    gender: "Male",
    email: "david.okafor@redeemersunive.edu.ng",
    phone: "08050987639",
    username: "davidokafor6",
    password: "RunAdmin!99",
    institutionName: "Redeemer's University",
    isPrimaryAdmin: true,
    status: "inactive",
    createdAt: "2026-03-06T09:35:00.000Z",
    archivedAt: null,
  },
  {
    id: "um-blessing-adeyemi",
    code: "007",
    firstName: "Blessing",
    otherName: "",
    lastName: "Adeyemi",
    gender: "Female",
    email: "blessing.adeyemi@afebabalolauni.edu.ng",
    phone: "08052222206",
    username: "blessingadeyemi7",
    password: "AbuadAdmin!7",
    institutionName: "Afe Babalola University",
    isPrimaryAdmin: false,
    status: "active",
    createdAt: "2026-03-07T16:05:00.000Z",
    archivedAt: null,
  },
  {
    id: "um-michael-adamu",
    code: "008",
    firstName: "Michael",
    otherName: "Segun",
    lastName: "Adamu",
    gender: "Male",
    email: "michael.adamu@landmarkuniver.edu.ng",
    phone: "08053456773",
    username: "michaeladamu8",
    password: "LmuAdmin!808",
    institutionName: "Landmark University",
    isPrimaryAdmin: true,
    status: "active",
    createdAt: "2026-03-08T11:15:00.000Z",
    archivedAt: null,
  },
  {
    // Email matches the ManagedUser seeded in rbac.store.ts so login
    // resolves this account's *live* Role assignment — see
    // `src/services/auth.service.ts`. This is also the account behind the
    // long-standing "Turon_Admin" demo login (root/unrestricted access).
    id: "um-christian-smart",
    code: "009",
    firstName: "Christian",
    otherName: "",
    lastName: "Smart",
    gender: "Male",
    email: "christian.smart@turontech.com",
    phone: "08023778912",
    username: "turon_admin",
    password: "Turon@2024",
    institutionName: "XYZ College of Technology",
    isPrimaryAdmin: true,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    archivedAt: null,
  },
  {
    // A different institution from Christian Smart above — one User
    // Manager account per institution, so each is a clean, independent
    // login to test. Logs in with the restricted "Front Desk Officer" Role
    // (see the matching ManagedUser in rbac.store.ts): Ahmadu Bello
    // University has more modules active than her role grants, so what she
    // *doesn't* see proves the Role is the thing limiting her, not the
    // institution.
    id: "um-amara-bello",
    code: "010",
    firstName: "Amara",
    otherName: "",
    lastName: "Bello",
    gender: "Female",
    email: "amara.bello@turontech.com",
    phone: "08023110098",
    username: "amara_bello",
    password: "Amara@2024",
    institutionName: "Ahmadu Bello University",
    isPrimaryAdmin: false,
    status: "active",
    createdAt: "2026-01-06T00:00:00.000Z",
    archivedAt: null,
  },
];

interface UserManagersState {
  userManagers: UserManagerAccount[];
  createUserManager: (
    account: Omit<
      UserManagerAccount,
      "id" | "code" | "createdAt" | "archivedAt"
    >,
  ) => UserManagerAccount;
  updateUserManager: (id: string, patch: Partial<UserManagerAccount>) => void;
  archiveUserManager: (id: string) => void;
  restoreUserManager: (id: string) => void;
  /** Generates a fresh mock password, stores it, and returns it so the caller can surface it to the admin. */
  resetPassword: (id: string) => string;
}

export const useUserManagersStore = create<UserManagersState>()(
  persist(
    (set, get) => ({
      userManagers: SEEDED_USER_MANAGERS,

      createUserManager: (account) => {
        const nextCode = String(get().userManagers.length + 1).padStart(3, "0");
        const newAccount: UserManagerAccount = {
          ...account,
          id: makeId(),
          code: nextCode,
          createdAt: new Date().toISOString(),
          archivedAt: null,
        };
        set((state) => ({
          userManagers: [newAccount, ...state.userManagers],
        }));
        return newAccount;
      },

      updateUserManager: (id, patch) => {
        set((state) => ({
          userManagers: state.userManagers.map((account) =>
            account.id === id ? { ...account, ...patch } : account,
          ),
        }));
      },

      archiveUserManager: (id) => {
        set((state) => ({
          userManagers: state.userManagers.map((account) =>
            account.id === id
              ? { ...account, archivedAt: new Date().toISOString() }
              : account,
          ),
        }));
      },

      restoreUserManager: (id) => {
        set((state) => ({
          userManagers: state.userManagers.map((account) =>
            account.id === id ? { ...account, archivedAt: null } : account,
          ),
        }));
      },

      resetPassword: (id) => {
        const newPassword = generatePassword();
        set((state) => ({
          userManagers: state.userManagers.map((account) =>
            account.id === id ? { ...account, password: newPassword } : account,
          ),
        }));
        return newPassword;
      },
    }),
    {
      name: "t-educare-user-managers",
      version: 3,
      // Mock data standing in for a real API (see frontend/CLAUDE.md) — a
      // version bump means "discard whatever was cached and reseed" rather
      // than migrate field by field.
      migrate: () => ({ userManagers: SEEDED_USER_MANAGERS }),
    },
  ),
);
