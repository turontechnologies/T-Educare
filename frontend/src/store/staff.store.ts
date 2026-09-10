import { create } from "zustand";
import { persist } from "zustand/middleware";

export type StaffCategory = "Academic Staff" | "Non-Academic Staff";

export interface StaffDesignation {
  id: string;
  name: string;
  description: string;
  category: StaffCategory;
}

function makeId() {
  return `designation-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEEDED_DESIGNATIONS: StaffDesignation[] = [
  {
    id: makeId(),
    name: "Lecturer",
    description: "Lecturer",
    category: "Academic Staff",
  },
  {
    id: makeId(),
    name: "HOD",
    description: "Head of Department",
    category: "Academic Staff",
  },
  {
    id: makeId(),
    name: "Provost",
    description: "Provost",
    category: "Academic Staff",
  },
  {
    id: makeId(),
    name: "Bursar",
    description: "Bursar",
    category: "Non-Academic Staff",
  },
];

interface StaffState {
  designations: StaffDesignation[];
  createDesignation: (designation: Omit<StaffDesignation, "id">) => void;
  deleteDesignation: (id: string) => void;
}

export const useStaffStore = create<StaffState>()(
  persist(
    (set) => ({
      designations: SEEDED_DESIGNATIONS,

      createDesignation: (designation) => {
        set((state) => ({
          designations: [
            ...state.designations,
            { ...designation, id: makeId() },
          ],
        }));
      },

      deleteDesignation: (id) => {
        set((state) => ({
          designations: state.designations.filter(
            (designation) => designation.id !== id,
          ),
        }));
      },
    }),
    {
      name: "t-educare-staff",
      version: 1,
      // Discard-and-reseed on a shape change — see the identical note in
      // institutions.store.ts.
      migrate: () => ({ designations: SEEDED_DESIGNATIONS }),
    },
  ),
);
