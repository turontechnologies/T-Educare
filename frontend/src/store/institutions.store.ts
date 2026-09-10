import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Institution } from "@/types/institution";

function makeId() {
  return `inst-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEEDED_INSTITUTIONS: Institution[] = [
  {
    id: "inst-xyz-college",
    name: "XYZ College of Technology",
    modulesCount: 10,
    studentCount: 90,
    revenue: 120_000,
    status: "active",
    createdAt: "2026-03-03T14:32:00.000Z",
  },
  {
    id: "inst-babcock",
    name: "Babcock University",
    modulesCount: 6,
    studentCount: 70,
    revenue: 85_000,
    status: "active",
    createdAt: "2026-03-03T11:13:00.000Z",
  },
  {
    id: "inst-ibadan",
    name: "University of Ibadan",
    modulesCount: 8,
    studentCount: 50,
    revenue: 50_000,
    status: "inactive",
    createdAt: "2026-03-03T09:15:00.000Z",
  },
];

interface InstitutionsState {
  institutions: Institution[];
  createInstitution: (
    institution: Omit<Institution, "id" | "createdAt">,
  ) => Institution;
  updateInstitution: (id: string, patch: Partial<Institution>) => void;
  deleteInstitution: (id: string) => void;
}

export const useInstitutionsStore = create<InstitutionsState>()(
  persist(
    (set) => ({
      institutions: SEEDED_INSTITUTIONS,

      createInstitution: (institution) => {
        const newInstitution: Institution = {
          ...institution,
          id: makeId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          institutions: [newInstitution, ...state.institutions],
        }));
        return newInstitution;
      },

      updateInstitution: (id, patch) => {
        set((state) => ({
          institutions: state.institutions.map((institution) =>
            institution.id === id ? { ...institution, ...patch } : institution,
          ),
        }));
      },

      deleteInstitution: (id) => {
        set((state) => ({
          institutions: state.institutions.filter(
            (institution) => institution.id !== id,
          ),
        }));
      },
    }),
    { name: "t-educare-institutions" },
  ),
);
