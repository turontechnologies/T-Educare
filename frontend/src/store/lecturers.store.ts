import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SEED_FACULTY_IDS } from "@/store/faculties.store";
import { SEED_SCHOOL_IDS } from "@/store/schools.store";
import type { Lecturer } from "@/types/lecturer";

function makeId() {
  return `lecturer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEEDED_LECTURERS: Lecturer[] = [
  {
    id: makeId(),
    username: "UL-10010",
    position: "Dean of a Faculty",
    assignmentType: "school",
    assignmentId: SEED_SCHOOL_IDS.engineering,
    gender: "Male",
    firstName: "Oladapo",
    middleName: "Frank",
    lastName: "Babajide",
    email: "oladapo.babajide@staff.xyzcollege.edu.ng",
    phone: "08038829911",
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
  {
    id: makeId(),
    username: "UL-10015",
    position: "Head of Department",
    assignmentType: "faculty",
    assignmentId: SEED_FACULTY_IDS.law,
    gender: "Female",
    firstName: "Precious",
    middleName: "Jane",
    lastName: "Paul",
    email: "precious.paul@staff.xyzcollege.edu.ng",
    phone: "08052213340",
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
];

interface LecturersState {
  lecturers: Lecturer[];
  createLecturer: (
    lecturer: Omit<Lecturer, "id" | "createdAt" | "archivedAt">,
  ) => Lecturer;
  updateLecturer: (id: string, patch: Partial<Lecturer>) => void;
  archiveLecturer: (id: string) => void;
  restoreLecturer: (id: string) => void;
}

export const useLecturersStore = create<LecturersState>()(
  persist(
    (set) => ({
      lecturers: SEEDED_LECTURERS,

      createLecturer: (lecturer) => {
        const newLecturer: Lecturer = {
          ...lecturer,
          id: makeId(),
          createdAt: new Date().toISOString(),
          archivedAt: null,
        };
        set((state) => ({ lecturers: [newLecturer, ...state.lecturers] }));
        return newLecturer;
      },

      updateLecturer: (id, patch) => {
        set((state) => ({
          lecturers: state.lecturers.map((lecturer) =>
            lecturer.id === id ? { ...lecturer, ...patch } : lecturer,
          ),
        }));
      },

      archiveLecturer: (id) => {
        set((state) => ({
          lecturers: state.lecturers.map((lecturer) =>
            lecturer.id === id
              ? { ...lecturer, archivedAt: new Date().toISOString() }
              : lecturer,
          ),
        }));
      },

      restoreLecturer: (id) => {
        set((state) => ({
          lecturers: state.lecturers.map((lecturer) =>
            lecturer.id === id ? { ...lecturer, archivedAt: null } : lecturer,
          ),
        }));
      },
    }),
    {
      name: "t-educare-lecturers",
      version: 1,
      migrate: () => ({ lecturers: SEEDED_LECTURERS }),
    },
  ),
);
