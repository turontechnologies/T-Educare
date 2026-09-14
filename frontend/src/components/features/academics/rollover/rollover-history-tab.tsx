"use client";

import { useMemo, useState } from "react";
import { ArrowRight, History, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAcademicsStore } from "@/store/academics.store";
import { useRolloverStore } from "@/store/rollover.store";
import { useStudentsStore } from "@/store/students.store";
import { RolloverReviewTable } from "./rollover-review-table";
import type { RolloverRecord } from "@/types/rollover";

const dateTimeLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
    .format(new Date(iso))
    .replace(/ /g, "-") +
  ", " +
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));

export function RolloverHistoryTab() {
  const records = useRolloverStore((state) => state.records);
  const sessions = useAcademicsStore((state) => state.sessions);
  const students = useStudentsStore((state) => state.students);
  const [detail, setDetail] = useState<RolloverRecord | null>(null);

  const completed = useMemo(
    () =>
      records
        .filter((r) => r.status === "completed")
        .sort((a, b) =>
          (b.completedAt ?? "").localeCompare(a.completedAt ?? ""),
        ),
    [records],
  );

  const sessionName = (id: string) =>
    sessions.find((s) => s.id === id)?.session ?? "—";

  return (
    <>
      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardContent className="p-0">
          {completed.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <History className="size-8" />
              <p className="text-sm">No rollovers have been completed yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {completed.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => setDetail(record)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted animate-in fade-in duration-300"
                >
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    {sessionName(record.fromSessionId)}
                    <ArrowRight className="size-4 text-muted-foreground" />
                    {sessionName(record.toSessionId)}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>{record.entries.length} students</span>
                    <span className="font-medium text-emerald-600">
                      Completed
                    </span>
                    <span>
                      {record.completedAt
                        ? dateTimeLabel(record.completedAt)
                        : "—"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent
          showCloseButton={false}
          className="w-full max-w-3xl gap-0 overflow-hidden p-0 sm:max-w-3xl"
        >
          <div className="flex items-center justify-between bg-primary px-6 py-4">
            <DialogTitle className="text-base font-medium text-white">
              Rollover Details
            </DialogTitle>
            <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
              <X className="size-5" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
          {detail && (
            <div className="max-h-[65vh] space-y-4 overflow-y-auto p-6">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  {sessionName(detail.fromSessionId)}
                  <ArrowRight className="size-4 text-muted-foreground" />
                  {sessionName(detail.toSessionId)}
                </div>
                <span className="text-muted-foreground">
                  {detail.completedAt ? dateTimeLabel(detail.completedAt) : "—"}
                </span>
              </div>
              <RolloverReviewTable
                entries={detail.entries}
                students={students}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
