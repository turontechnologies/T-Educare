"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePayslipHistory } from "@/hooks/use-finance";
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

interface ViewPayslipDialogProps {
  row?: PayrollRow;
  onOpenChange: (open: boolean) => void;
}

export function ViewPayslipDialog({
  row,
  onOpenChange,
}: ViewPayslipDialogProps) {
  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Payslip
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {row && (
          <ViewPayslipBody
            key={row.staffId}
            staffId={row.staffId}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ViewPayslipBody({
  staffId,
  onOpenChange,
}: {
  staffId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: history = [] } = usePayslipHistory(staffId);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const payslip = history.find((p) => p.id === selectedId) ?? history[0];

  return (
    <>
      <div className="space-y-4 p-6">
        {payslip ? (
          <>
            <div>
              <p className="text-sm text-muted-foreground">
                {MONTH_NAMES[payslip.periodMonth - 1]} {payslip.periodYear}
              </p>
              <p className="font-semibold text-foreground">
                {payslip.staffName}, {payslip.departmentName}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Basic pay</span>
                <span className="font-medium text-foreground">
                  {formatNaira(payslip.basicPay)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Allowances</span>
                <span className="font-medium text-foreground">
                  {formatNaira(payslip.allowances)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Deductions</span>
                <span className="font-medium text-destructive">
                  −{formatNaira(payslip.deductions)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="font-medium text-foreground">Net pay</span>
                <span className="font-semibold text-foreground">
                  {formatNaira(payslip.netPay)}
                </span>
              </div>
            </div>

            {history.length > 1 && (
              <div>
                <p className="mb-2 text-sm text-foreground">History</p>
                <div className="flex flex-wrap gap-1.5">
                  {history.map((p) => (
                    <Badge
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={
                        p.id === payslip.id
                          ? "cursor-pointer rounded-md bg-primary py-1.5 text-xs text-primary-foreground"
                          : "cursor-pointer rounded-md bg-muted py-1.5 text-xs text-muted-foreground hover:bg-muted/70"
                      }
                    >
                      {MONTH_NAMES[p.periodMonth - 1].slice(0, 3)}{" "}
                      {p.periodYear}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No payslip has been generated for this staff member yet.
          </p>
        )}
      </div>

      <div className="flex items-center justify-end border-t border-border bg-muted/50 px-6 py-4">
        <Button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-full px-6"
        >
          Close
        </Button>
      </div>
    </>
  );
}
