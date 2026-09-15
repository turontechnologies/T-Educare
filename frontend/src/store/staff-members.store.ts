import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SEED_DEPARTMENT_IDS } from "@/store/departments.store";
import type { StaffMember } from "@/types/staff-member";

function makeId() {
  return `staff-member-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEEDED_STAFF_MEMBERS: StaffMember[] = [
  {
    id: makeId(),
    staffId: "UL-10010",
    role: "HOD",
    designation: "HOD",
    departmentId: SEED_DEPARTMENT_IDS.computing,
    gender: "Male",
    firstName: "Oladapo",
    middleName: "Frank",
    lastName: "Babajide",
    maritalStatus: "Married",
    email: "oladapo.babajide@staff.xyzcollege.edu.ng",
    phone: "08038829911",
    emergencyContact: "08023117890",
    dateOfBirth: new Date("1981-08-21T00:00:00.000Z").toISOString(),
    employmentStartDate: new Date("2020-03-21T00:00:00.000Z").toISOString(),
    contactAddress: "13 Alabi Street, Gbagada",
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
  {
    id: makeId(),
    staffId: "UL-10015",
    role: "Bursar",
    designation: "Bursar",
    departmentId: SEED_DEPARTMENT_IDS.accounting,
    gender: "Female",
    firstName: "Precious",
    middleName: "Jane",
    lastName: "Paul",
    maritalStatus: "Single",
    email: "precious.paul@staff.xyzcollege.edu.ng",
    phone: "08052213340",
    emergencyContact: "08071122334",
    dateOfBirth: new Date("1990-05-14T00:00:00.000Z").toISOString(),
    employmentStartDate: new Date("2021-06-01T00:00:00.000Z").toISOString(),
    contactAddress: "22 Femi Okunnu Way, Lekki",
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
];

interface StaffMembersState {
  staffMembers: StaffMember[];
  createStaffMember: (
    staffMember: Omit<StaffMember, "id" | "createdAt" | "archivedAt">,
  ) => StaffMember;
  updateStaffMember: (id: string, patch: Partial<StaffMember>) => void;
  archiveStaffMember: (id: string) => void;
  restoreStaffMember: (id: string) => void;
}

export const useStaffMembersStore = create<StaffMembersState>()(
  persist(
    (set) => ({
      staffMembers: SEEDED_STAFF_MEMBERS,

      createStaffMember: (staffMember) => {
        const newStaffMember: StaffMember = {
          ...staffMember,
          id: makeId(),
          createdAt: new Date().toISOString(),
          archivedAt: null,
        };
        set((state) => ({
          staffMembers: [newStaffMember, ...state.staffMembers],
        }));
        return newStaffMember;
      },

      updateStaffMember: (id, patch) => {
        set((state) => ({
          staffMembers: state.staffMembers.map((staffMember) =>
            staffMember.id === id ? { ...staffMember, ...patch } : staffMember,
          ),
        }));
      },

      archiveStaffMember: (id) => {
        set((state) => ({
          staffMembers: state.staffMembers.map((staffMember) =>
            staffMember.id === id
              ? { ...staffMember, archivedAt: new Date().toISOString() }
              : staffMember,
          ),
        }));
      },

      restoreStaffMember: (id) => {
        set((state) => ({
          staffMembers: state.staffMembers.map((staffMember) =>
            staffMember.id === id
              ? { ...staffMember, archivedAt: null }
              : staffMember,
          ),
        }));
      },
    }),
    {
      name: "t-educare-staff-members",
      version: 1,
      migrate: () => ({ staffMembers: SEEDED_STAFF_MEMBERS }),
    },
  ),
);
