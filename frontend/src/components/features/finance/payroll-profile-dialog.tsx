"use client";

import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NotchedField } from "@/components/shared/notched-field";
import { useUpdatePayrollProfile } from "@/hooks/use-finance";
import type { PayrollRow } from "@/types/finance";

interface PayrollProfileDialogProps {
  row?: PayrollRow;
  onOpenChange: (open: boolean) => void;
}

export function PayrollProfileDialog({
  row,
  onOpenChange,
}: PayrollProfileDialogProps) {
  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Edit Payroll Profile
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {row && (
          <PayrollProfileForm
            key={row.staffId}
            row={row}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PayrollProfileForm({
  row,
  onDone,
}: {
  row: PayrollRow;
  onDone: () => void;
}) {
  const updateProfile = useUpdatePayrollProfile();

  const [allowances, setAllowances] = useState(String(row.allowances));
  const [deductions, setDeductions] = useState(String(row.deductions));
  const [onHold, setOnHold] = useState(row.onHold);
  const [onHoldReason, setOnHoldReason] = useState(row.onHoldReason ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const parsedAllowances = Number(allowances);
    const parsedDeductions = Number(deductions);
    if (!Number.isFinite(parsedAllowances) || parsedAllowances < 0) {
      toast.error("Enter a valid allowances amount");
      return;
    }
    if (!Number.isFinite(parsedDeductions) || parsedDeductions < 0) {
      toast.error("Enter a valid deductions amount");
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile.mutateAsync({
        staffId: row.staffId,
        payload: {
          allowances: parsedAllowances,
          deductions: parsedDeductions,
          onHold,
          onHoldReason: onHold ? onHoldReason.trim() || undefined : undefined,
        },
      });
      toast.success(`${row.staffName}'s payroll profile updated`);
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-5 p-6">
        <p className="text-sm text-muted-foreground">
          {row.staffName} · {row.staffCode} · {row.designationName}
        </p>

        <NotchedField
          label="Allowances (₦)"
          labelClassName="bg-popover"
          type="number"
          min={0}
          value={allowances}
          onChange={(event) => setAllowances(event.target.value)}
        />
        <NotchedField
          label="Deductions (₦)"
          labelClassName="bg-popover"
          type="number"
          min={0}
          value={deductions}
          onChange={(event) => setDeductions(event.target.value)}
        />

        <div className="flex items-center gap-2">
          <Checkbox
            id="payroll-on-hold"
            checked={onHold}
            onCheckedChange={(checked) => setOnHold(checked === true)}
          />
          <Label htmlFor="payroll-on-hold" className="text-sm font-normal">
            Hold this staff member from the next payroll run
          </Label>
        </div>

        {onHold && (
          <NotchedField
            label="Reason (optional)"
            labelClassName="bg-popover"
            value={onHoldReason}
            onChange={(event) => setOnHoldReason(event.target.value)}
          />
        )}
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          disabled={submitting}
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
