"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLedger } from "@/hooks/use-finance";
import type { StudentBillSummary } from "@/types/finance";

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

interface ViewLedgerDialogProps {
  bill?: StudentBillSummary;
  onOpenChange: (open: boolean) => void;
}

export function ViewLedgerDialog({
  bill,
  onOpenChange,
}: ViewLedgerDialogProps) {
  const { data: ledger = [] } = useLedger(bill?.studentId, { enabled: !!bill });

  return (
    <Dialog open={!!bill} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-3xl gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Student Ledger
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {bill && (
          <>
            <div className="max-h-[65vh] space-y-4 overflow-y-auto p-6">
              <div>
                <p className="text-base font-semibold text-foreground">
                  {bill.studentName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {bill.matricNo} · {bill.departmentName}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  className={
                    bill.status === "OWING"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-emerald-500/10 text-emerald-600"
                  }
                >
                  {bill.status === "OWING" ? "Owing" : "Paid"}
                </Badge>
                <Badge variant="outline" className="rounded-md py-1.5 text-xs">
                  Total billed: {formatNaira(bill.totalBilled)}
                </Badge>
                <Badge variant="outline" className="rounded-md py-1.5 text-xs">
                  Total paid: {formatNaira(bill.totalPaid)}
                </Badge>
                <Badge variant="outline" className="rounded-md py-1.5 text-xs">
                  Balance: {formatNaira(bill.balance)}
                </Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Charge</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((line) => (
                    <TableRow
                      key={line.id}
                      className="animate-in fade-in duration-300"
                    >
                      <TableCell className="text-muted-foreground">
                        {new Date(line.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {line.description}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {line.reference}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatNaira(line.charge)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {line.payment != null ? formatNaira(line.payment) : ""}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatNaira(line.runningBalance)}
                      </TableCell>
                      <TableCell
                        className={
                          line.lineBalance > 0
                            ? "font-medium text-destructive"
                            : "font-medium text-emerald-600"
                        }
                      >
                        {line.lineBalance > 0
                          ? `${formatNaira(line.lineBalance)} due`
                          : "Paid"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {ledger.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No charges yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
        )}
      </DialogContent>
    </Dialog>
  );
}
