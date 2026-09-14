import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyRolloverToStudent,
  computeRolloverEntry,
  resolveToLevel,
} from "@/lib/rollover";
import { useStudentsStore } from "@/store/students.store";
import type { RolloverDecision, RolloverRecord } from "@/types/rollover";

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

interface RolloverState {
  /** Drafts and completed rollovers together — filter by `status` for history. */
  records: RolloverRecord[];
  /** Computes fresh entries for every student currently on `fromSessionId` and stores them as a new draft. */
  createDraft: (fromSessionId: string, toSessionId: string) => RolloverRecord;
  updateEntryDecision: (
    recordId: string,
    studentId: string,
    decision: RolloverDecision,
    overrideReason?: string,
  ) => void;
  /** Applies every entry's decision to the real student records, then marks the draft completed. No-op if already completed. */
  confirmRollover: (recordId: string) => void;
  discardDraft: (recordId: string) => void;
}

export const useRolloverStore = create<RolloverState>()(
  persist(
    (set, get) => ({
      records: [],

      createDraft: (fromSessionId, toSessionId) => {
        const students = useStudentsStore
          .getState()
          .students.filter(
            (s) =>
              s.currentSessionId === fromSessionId &&
              !s.archivedAt &&
              s.status === "active",
          );
        const entries = students.map(computeRolloverEntry);

        const draft: RolloverRecord = {
          id: makeId("rollover"),
          fromSessionId,
          toSessionId,
          createdAt: new Date().toISOString(),
          completedAt: null,
          status: "draft",
          entries,
        };
        set((state) => ({ records: [draft, ...state.records] }));
        return draft;
      },

      updateEntryDecision: (recordId, studentId, decision, overrideReason) => {
        set((state) => ({
          records: state.records.map((record) =>
            record.id === recordId
              ? {
                  ...record,
                  entries: record.entries.map((entry) =>
                    entry.studentId === studentId
                      ? {
                          ...entry,
                          decision,
                          toLevel: resolveToLevel(entry.fromLevel, decision),
                          overridden: decision !== entry.suggestedDecision,
                          overrideReason:
                            decision !== entry.suggestedDecision
                              ? overrideReason
                              : undefined,
                        }
                      : entry,
                  ),
                }
              : record,
          ),
        }));
      },

      confirmRollover: (recordId) => {
        const record = get().records.find((r) => r.id === recordId);
        if (!record || record.status === "completed") return;

        const entryByStudentId = new Map(
          record.entries.map((entry) => [entry.studentId, entry]),
        );
        const nextStudents = useStudentsStore
          .getState()
          .students.map((student) => {
            const entry = entryByStudentId.get(student.id);
            return entry
              ? applyRolloverToStudent(student, entry, record.toSessionId)
              : student;
          });
        useStudentsStore.getState().setStudents(nextStudents);

        set((state) => ({
          records: state.records.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  status: "completed",
                  completedAt: new Date().toISOString(),
                }
              : r,
          ),
        }));
      },

      discardDraft: (recordId) => {
        set((state) => ({
          records: state.records.filter((r) => r.id !== recordId),
        }));
      },
    }),
    {
      name: "t-educare-rollover",
      version: 1,
      migrate: () => ({ records: [] }),
    },
  ),
);
