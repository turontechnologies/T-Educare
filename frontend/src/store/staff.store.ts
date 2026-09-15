import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StaffDesignation } from "@/types/staff-designation";

export type {
  StaffCategory,
  StaffDesignation,
} from "@/types/staff-designation";

function makeId() {
  return `designation-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEEDED_DESIGNATIONS: StaffDesignation[] = [
  {
    id: makeId(),
    name: "Lecturer",
    description: "Lecturer",
    category: "Academic Staff",
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
  {
    id: makeId(),
    name: "HOD",
    description: "Head of Department",
    category: "Academic Staff",
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
  {
    id: makeId(),
    name: "Provost",
    description: "Provost",
    category: "Academic Staff",
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
  {
    id: makeId(),
    name: "Vice Chancellor",
    description: "Vice Chancellor",
    category: "Academic Staff",
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
  {
    id: makeId(),
    name: "Bursar",
    description: "Bursar",
    category: "Non-Academic Staff",
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
];

interface StaffState {
  designations: StaffDesignation[];
  createDesignation: (
    designation: Omit<StaffDesignation, "id" | "createdAt" | "archivedAt">,
  ) => StaffDesignation;
  updateDesignation: (id: string, patch: Partial<StaffDesignation>) => void;
  archiveDesignation: (id: string) => void;
  restoreDesignation: (id: string) => void;
}

export const useStaffStore = create<StaffState>()(
  persist(
    (set) => ({
      designations: SEEDED_DESIGNATIONS,

      createDesignation: (designation) => {
        const newDesignation: StaffDesignation = {
          ...designation,
          id: makeId(),
          createdAt: new Date().toISOString(),
          archivedAt: null,
        };
        set((state) => ({
          designations: [newDesignation, ...state.designations],
        }));
        return newDesignation;
      },

      updateDesignation: (id, patch) => {
        set((state) => ({
          designations: state.designations.map((designation) =>
            designation.id === id ? { ...designation, ...patch } : designation,
          ),
        }));
      },

      archiveDesignation: (id) => {
        set((state) => ({
          designations: state.designations.map((designation) =>
            designation.id === id
              ? { ...designation, archivedAt: new Date().toISOString() }
              : designation,
          ),
        }));
      },

      restoreDesignation: (id) => {
        set((state) => ({
          designations: state.designations.map((designation) =>
            designation.id === id
              ? { ...designation, archivedAt: null }
              : designation,
          ),
        }));
      },
    }),
    {
      name: "t-educare-staff",
      version: 3,
      // Discard-and-reseed on a shape change — see the identical note in
      // institutions.store.ts.
      migrate: () => ({ designations: SEEDED_DESIGNATIONS }),
    },
  ),
);
