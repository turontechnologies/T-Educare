"use client";

import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRunPayroll } from "@/hooks/use-finance";
import type { PayrollRow } from "@/types/finance";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

interface RunPayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodYear: number;
  periodMonth: number;
  rows: PayrollRow[];
}

export function RunPayrollDialog({
  open,
  onOpenChange,
  periodYear,
  periodMonth,
  rows,
}: RunPayrollDialogProps) {
  const runPayroll = useRunPayroll();

  const pending = rows.filter((r) => r.status !== "PAID");
  const onHold = pending.filter((r) => r.onHold);
  const toPay = pending.filter((r) => !r.onHold);
  const grossPay = toPay.reduce((sum, r) => sum + r.basicPay + r.allowances, 0);
  const totalDeductions = toPay.reduce((sum, r) => sum + r.deductions, 0);
  const netPay = toPay.reduce((sum, r) => sum + r.netPay, 0);

  const handleRun = async () => {
    try {
      const result = await runPayroll.mutateAsync({ periodYear, periodMonth });
      toast.success(
        `Payroll run — ${result.staffPaid} staff paid${
          result.staffOnHold > 0 ? `, ${result.staffOnHold} on hold` : ""
        }`,
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to run payroll",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Run Payroll · {MONTH_NAMES[periodMonth - 1]} {periodYear}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <div className="space-y-4 p-6">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Staff to pay</span>
              <span className="font-medium text-foreground">
                {toPay.length}
              </span>
            </div>
            {onHold.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">On hold</span>
                <span className="font-medium text-foreground">
                  {onHold.map((r) => r.staffName).join(", ")}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Gross pay</span>
              <span className="font-medium text-foreground">
                {formatNaira(grossPay)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Deductions</span>
              <span className="font-medium text-destructive">
                −{formatNaira(totalDeductions)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="font-medium text-foreground">Net pay</span>
              <span className="font-semibold text-foreground">
                {formatNaira(netPay)}
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            This calculates each person&apos;s net pay, generates their payslip
            for {MONTH_NAMES[periodMonth - 1]} {periodYear}, and records the run
            in the transaction log. It can&apos;t be undone from here.
          </p>
        </div>

        <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
          <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Cancel
          </DialogClose>
          <Button
            type="button"
            disabled={runPayroll.isPending || toPay.length === 0}
            onClick={handleRun}
            className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Run payroll
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
