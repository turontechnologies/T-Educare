"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { NotchedSelectField } from "@/components/shared/notched-field";
import { cn } from "@/lib/utils";
import {
  ROLLOVER_DECISION_BADGE_CLASS,
  ROLLOVER_DECISION_LABELS,
} from "@/lib/rollover";
import { notifyInstitution } from "@/lib/notify";
import { useAcademicsStore } from "@/store/academics.store";
import { useAuthStore } from "@/store/auth.store";
import { useRolloverStore } from "@/store/rollover.store";
import { useStudentsStore } from "@/store/students.store";
import { RolloverReviewTable } from "./rollover-review-table";
import type { RolloverDecision, RolloverRecord } from "@/types/rollover";

const STEP_LABELS = ["Sessions", "Progression", "Review", "Confirm"];

interface RolloverWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceSessionId: string;
}

export function RolloverWizardDialog({
  open,
  onOpenChange,
  sourceSessionId,
}: RolloverWizardDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-3xl gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Session Rollover
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer text-white/80 transition-colors hover:text-white"
          >
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Keyed to the source session so reopening always starts a fresh wizard. */}
        {open && (
          <RolloverWizard
            key={sourceSessionId}
            sourceSessionId={sourceSessionId}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RolloverWizard({
  sourceSessionId,
  onDone,
}: {
  sourceSessionId: string;
  onDone: () => void;
}) {
  const authUser = useAuthStore((state) => state.user);
  const sessions = useAcademicsStore((state) => state.sessions);
  const students = useStudentsStore((state) => state.students);
  const createDraft = useRolloverStore((state) => state.createDraft);
  const updateEntryDecision = useRolloverStore(
    (state) => state.updateEntryDecision,
  );
  const confirmRollover = useRolloverStore((state) => state.confirmRollover);
  const discardDraft = useRolloverStore((state) => state.discardDraft);

  const [step, setStep] = useState(1);
  const [sourceId, setSourceId] = useState(sourceSessionId);
  const [destinationId, setDestinationId] = useState(() => {
    const source = sessions.find((s) => s.id === sourceSessionId);
    const candidate = sessions.find(
      (s) =>
        !s.archivedAt &&
        s.id !== sourceSessionId &&
        source &&
        new Date(s.from).getTime() > new Date(source.from).getTime(),
    );
    return candidate?.id ?? "";
  });
  const [draftId, setDraftId] = useState<string | null>(null);

  const draftRecord = useRolloverStore((state) =>
    state.records.find((r) => r.id === draftId),
  );

  const eligibleSources = useMemo(
    () => sessions.filter((s) => !s.archivedAt && s.status !== "upcoming"),
    [sessions],
  );
  const eligibleDestinations = useMemo(
    () => sessions.filter((s) => !s.archivedAt && s.id !== sourceId),
    [sessions, sourceId],
  );

  const sessionName = (id: string) =>
    sessions.find((s) => s.id === id)?.session ?? "—";

  const record: RolloverRecord | undefined = draftRecord;

  const progressionByLevel = useMemo(() => {
    if (!record) return [];
    const map = new Map<string, number>();
    for (const entry of record.entries) {
      map.set(entry.fromLevel, (map.get(entry.fromLevel) ?? 0) + 1);
    }
    return Array.from(map.entries());
  }, [record]);

  const summary = useMemo(() => {
    const base: Record<RolloverDecision, number> = {
      promote: 0,
      "promote-carryover": 0,
      repeat: 0,
      deferred: 0,
      graduating: 0,
      hold: 0,
    };
    record?.entries.forEach((entry) => base[entry.decision]++);
    return base;
  }, [record]);

  const closeAndDiscard = () => {
    if (draftId) discardDraft(draftId);
    onDone();
  };

  const goToProgression = () => {
    if (!sourceId || !destinationId) {
      toast.error("Select both a source and destination session");
      return;
    }
    if (sourceId === destinationId) {
      toast.error("Source and destination must be different sessions");
      return;
    }
    const created = createDraft(sourceId, destinationId);
    if (created.entries.length === 0) {
      toast.error(
        `No students are currently on ${sessionName(sourceId)} to roll over`,
      );
      discardDraft(created.id);
      return;
    }
    setDraftId(created.id);
    setStep(2);
  };

  const handleConfirm = () => {
    if (!draftId) return;
    confirmRollover(draftId);
    if (authUser?.institutionId) {
      notifyInstitution(
        authUser.institutionId,
        "Session rollover completed",
        `${record?.entries.length ?? 0} students were rolled over from ${sessionName(sourceId)} to ${sessionName(destinationId)}.`,
        "/dashboard/academics/sessions",
      );
    }
    setStep(5);
  };

  return (
    <>
      <div className="flex items-center gap-1.5 border-b border-border px-6 py-3 text-xs font-medium text-muted-foreground">
        {STEP_LABELS.map((label, index) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[11px]",
                step > index + 1
                  ? "bg-emerald-500 text-white"
                  : step === index + 1
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {step > index + 1 ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={cn(
                step === index + 1 && "font-semibold text-foreground",
              )}
            >
              {label}
            </span>
            {index < STEP_LABELS.length - 1 && (
              <ChevronRight className="size-3.5 text-muted-foreground/50" />
            )}
          </div>
        ))}
      </div>

      <div className="max-h-[65vh] overflow-y-auto p-6">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-2 space-y-5 duration-300">
            <p className="text-sm text-muted-foreground">
              Move students from a completed session into the next one,
              preserving their full academic history.
            </p>
            <NotchedSelectField
              label="Source Session"
              value={sourceId}
              onValueChange={setSourceId}
              options={eligibleSources.map((s) => ({
                label: `${s.session} (${s.status})`,
                value: s.id,
              }))}
              placeholder="Select source session"
            />
            <NotchedSelectField
              label="Destination Session"
              value={destinationId}
              onValueChange={setDestinationId}
              options={eligibleDestinations.map((s) => ({
                label: `${s.session} (${s.status})`,
                value: s.id,
              }))}
              placeholder="Select destination session"
            />
          </div>
        )}

        {step === 2 && record && (
          <div className="animate-in fade-in slide-in-from-right-2 space-y-4 duration-300">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              {sessionName(sourceId)}
              <ArrowRight className="size-4 text-muted-foreground" />
              {sessionName(destinationId)}
            </div>
            <p className="text-sm text-muted-foreground">
              Academic progression — students grouped by their current level.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {progressionByLevel.map(([level, count]) => (
                <div
                  key={level}
                  className="animate-in fade-in slide-in-from-bottom-1 flex items-center justify-between rounded-md border border-border p-4 duration-300"
                >
                  <span className="font-medium text-foreground">{level}</span>
                  <span className="text-2xl font-semibold text-primary">
                    {count}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {record.entries.length} students total will be evaluated.
            </p>
          </div>
        )}

        {step === 3 && record && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <p className="mb-3 text-sm text-muted-foreground">
              Review each student&apos;s proposed decision before confirming.
              Overriding one requires a reason.
            </p>
            <RolloverReviewTable
              entries={record.entries}
              students={students}
              onOverride={(studentId, decision, reason) =>
                updateEntryDecision(draftId!, studentId, decision, reason)
              }
            />
          </div>
        )}

        {step === 4 && record && (
          <div className="animate-in fade-in slide-in-from-right-2 space-y-5 duration-300">
            <div className="rounded-md border border-border bg-muted/40 p-5 text-center">
              <p className="text-sm text-muted-foreground">Session Rollover</p>
              <div className="mt-1 flex items-center justify-center gap-2 text-lg font-semibold text-foreground">
                {sessionName(sourceId)}
                <ArrowRight className="size-5 text-muted-foreground" />
                {sessionName(destinationId)}
              </div>
            </div>

            <p className="text-center text-sm text-foreground">
              You&apos;re about to roll over{" "}
              <span className="font-semibold">{record.entries.length}</span>{" "}
              students from {sessionName(sourceId)} to{" "}
              {sessionName(destinationId)}.
            </p>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.keys(summary) as RolloverDecision[]).map((decision) => (
                <div
                  key={decision}
                  className="rounded-md border border-border p-3 text-center"
                >
                  <Badge className={ROLLOVER_DECISION_BADGE_CLASS[decision]}>
                    {ROLLOVER_DECISION_LABELS[decision]}
                  </Badge>
                  <p className="mt-1.5 text-xl font-semibold text-foreground">
                    {summary[decision]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 5 && record && (
          <div className="animate-in fade-in zoom-in-95 flex flex-col items-center gap-4 py-6 text-center duration-500">
            <span className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="size-9" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Session Rollover Completed
              </h3>
              <p className="mt-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                {sessionName(sourceId)}
                <ArrowRight className="size-4" />
                {sessionName(destinationId)}
              </p>
              <p className="mt-2 text-sm text-foreground">
                {record.entries.length} students processed successfully.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.keys(summary) as RolloverDecision[])
                .filter((d) => summary[d] > 0)
                .map((decision) => (
                  <div
                    key={decision}
                    className="rounded-md border border-border px-3 py-2 text-center"
                  >
                    <Badge className={ROLLOVER_DECISION_BADGE_CLASS[decision]}>
                      {ROLLOVER_DECISION_LABELS[decision]}
                    </Badge>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {summary[decision]}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-border bg-muted/50 px-6 py-4">
        {step === 1 && (
          <>
            <button
              type="button"
              onClick={closeAndDiscard}
              className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
            <Button
              type="button"
              onClick={goToProgression}
              className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Next
              <ArrowRight className="size-4" />
            </Button>
          </>
        )}

        {(step === 2 || step === 3) && (
          <>
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
            <Button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Next
              <ArrowRight className="size-4" />
            </Button>
          </>
        )}

        {step === 4 && (
          <>
            <button
              type="button"
              onClick={closeAndDiscard}
              className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="cursor-pointer text-sm font-medium text-secondary hover:underline"
              >
                Review Again
              </button>
              <Button
                type="button"
                onClick={handleConfirm}
                className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                Confirm Rollover
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </>
        )}

        {step === 5 && (
          <Button
            type="button"
            onClick={onDone}
            className="ml-auto gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Done
          </Button>
        )}
      </div>
    </>
  );
}
