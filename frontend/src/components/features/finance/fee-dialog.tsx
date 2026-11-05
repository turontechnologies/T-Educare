"use client";

import { useMemo, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  NotchedDateField,
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import { useCreateFeeType, useUpdateFeeType } from "@/hooks/use-finance";
import { useAcademicsStore } from "@/store/academics.store";
import { useDepartmentsStore } from "@/store/departments.store";
import { useProgramLevelsStore } from "@/store/program-levels.store";
import type { FeeType, LatePenaltyType } from "@/types/finance";

const ALL = "__all__";

const PENALTY_OPTIONS: { label: string; value: LatePenaltyType }[] = [
  { label: "None", value: "NONE" },
  { label: "Flat fee", value: "FLAT" },
  { label: "Percentage", value: "PERCENTAGE" },
];

interface FeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fee?: FeeType;
}

export function FeeDialog({ open, onOpenChange, fee }: FeeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-lg gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {fee ? "Edit Fee" : "Add Fee"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {open && (
          <FeeForm
            key={fee?.id ?? "new"}
            fee={fee}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FeeForm({ fee, onDone }: { fee?: FeeType; onDone: () => void }) {
  const departments = useDepartmentsStore((state) => state.departments);
  const programLevels = useProgramLevelsStore((state) => state.programLevels);
  const sessions = useAcademicsStore((state) => state.sessions);
  const createFeeType = useCreateFeeType();
  const updateFeeType = useUpdateFeeType();

  const [name, setName] = useState(fee?.name ?? "");
  const [departmentId, setDepartmentId] = useState(fee?.departmentId ?? ALL);
  const [programLevelId, setProgramLevelId] = useState(
    fee?.programLevelId ?? ALL,
  );
  const [academicSessionId, setAcademicSessionId] = useState(
    fee?.academicSessionId ?? "",
  );
  const [amount, setAmount] = useState(fee ? String(fee.amount) : "");
  const [dueDate, setDueDate] = useState(fee?.dueDate ?? "");
  const [latePenaltyType, setLatePenaltyType] = useState<LatePenaltyType>(
    fee?.latePenaltyType ?? "NONE",
  );
  const [latePenaltyValue, setLatePenaltyValue] = useState(
    fee?.latePenaltyValue != null ? String(fee.latePenaltyValue) : "",
  );
  const [submitting, setSubmitting] = useState(false);

  const departmentOptions = useMemo(
    () => [
      { label: "All programmes", value: ALL },
      ...departments
        .filter((d) => !d.archivedAt)
        .map((d) => ({ label: d.name, value: d.id })),
    ],
    [departments],
  );
  const levelOptions = useMemo(
    () => [
      { label: "All levels", value: ALL },
      ...programLevels
        .filter((l) => !l.archivedAt)
        .map((l) => ({ label: l.description, value: l.id })),
    ],
    [programLevels],
  );
  const sessionOptions = useMemo(
    () =>
      sessions
        .filter((s) => !s.archivedAt)
        .map((s) => ({ label: s.session, value: s.id })),
    [sessions],
  );

  const mutating = createFeeType.isPending || updateFeeType.isPending;

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const parsedAmount = Number(amount);
    const parsedPenaltyValue =
      latePenaltyValue.trim() === "" ? null : Number(latePenaltyValue);

    if (!trimmedName) {
      toast.error("Fee name is required");
      return;
    }
    if (!academicSessionId) {
      toast.error("Select a session");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!dueDate) {
      toast.error("Select a due date");
      return;
    }
    if (
      latePenaltyType !== "NONE" &&
      (parsedPenaltyValue === null || parsedPenaltyValue <= 0)
    ) {
      toast.error("Enter a late penalty value");
      return;
    }

    const payload = {
      name: trimmedName,
      departmentId: departmentId === ALL ? undefined : departmentId,
      programLevelId: programLevelId === ALL ? undefined : programLevelId,
      academicSessionId,
      amount: parsedAmount,
      dueDate,
      latePenaltyType,
      latePenaltyValue: latePenaltyType === "NONE" ? null : parsedPenaltyValue,
    };

    setSubmitting(true);
    try {
      if (fee) {
        await updateFeeType.mutateAsync({ id: fee.id, payload });
        toast.success(`${trimmedName} updated`);
      } else {
        const created = await createFeeType.mutateAsync(payload);
        toast.success(
          `${created.name} created · ${created.studentsBilled} student${
            created.studentsBilled === 1 ? "" : "s"
          } billed`,
        );
      }
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save fee",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="grid max-h-[70vh] grid-cols-1 gap-5 overflow-y-auto p-6 sm:grid-cols-2">
        <NotchedField
          label="Fee Type"
          labelClassName="bg-popover"
          className="sm:col-span-2"
          placeholder="e.g. Acceptance Fee"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <NotchedSelectField
          label="Programme"
          labelClassName="bg-popover"
          value={departmentId}
          onValueChange={setDepartmentId}
          options={departmentOptions}
          placeholder="Select programme"
        />
        <NotchedSelectField
          label="Level"
          labelClassName="bg-popover"
          value={programLevelId}
          onValueChange={setProgramLevelId}
          options={levelOptions}
          placeholder="Select level"
        />
        <NotchedSelectField
          label="Session"
          labelClassName="bg-popover"
          value={academicSessionId}
          onValueChange={setAcademicSessionId}
          options={sessionOptions}
          placeholder="Select session"
        />
        <NotchedField
          label="Amount (₦)"
          labelClassName="bg-popover"
          type="number"
          min={0}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <NotchedDateField
          label="Due Date"
          labelClassName="bg-popover"
          value={dueDate}
          onValueChange={setDueDate}
        />
        <NotchedSelectField
          label="Late penalty"
          labelClassName="bg-popover"
          value={latePenaltyType}
          onValueChange={(value) =>
            setLatePenaltyType(value as LatePenaltyType)
          }
          options={PENALTY_OPTIONS}
          placeholder="Select"
        />
        {latePenaltyType !== "NONE" && (
          <div>
            <Input
              type="number"
              min={0}
              placeholder={
                latePenaltyType === "FLAT"
                  ? "Flat amount (₦)"
                  : "Percentage of fee"
              }
              value={latePenaltyValue}
              onChange={(event) => setLatePenaltyValue(event.target.value)}
              className="h-11"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          disabled={submitting || mutating}
          onClick={handleSubmit}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Save
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
