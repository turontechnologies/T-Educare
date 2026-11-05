"use client";

import { useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NotchedDateField,
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import { useLedger, useRecordPayment } from "@/hooks/use-finance";
import { useUploadFile } from "@/hooks/use-upload";
import type { PaymentMethod, StudentBillSummary } from "@/types/finance";

const METHODS: { label: string; value: PaymentMethod }[] = [
  { label: "Bank transfer", value: "BANK_TRANSFER" },
  { label: "Cash", value: "CASH" },
  { label: "POS", value: "POS" },
  { label: "Cheque", value: "CHEQUE" },
];

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

interface RecordPaymentDialogProps {
  bill?: StudentBillSummary;
  onOpenChange: (open: boolean) => void;
}

export function RecordPaymentDialog({
  bill,
  onOpenChange,
}: RecordPaymentDialogProps) {
  return (
    <Dialog open={!!bill} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-lg gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Record Offline Payment
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {bill && (
          <RecordPaymentForm
            key={bill.studentId}
            bill={bill}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RecordPaymentForm({
  bill,
  onDone,
}: {
  bill: StudentBillSummary;
  onDone: () => void;
}) {
  const { data: ledger = [] } = useLedger(bill.studentId);
  const recordPayment = useRecordPayment();
  const uploadFile = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const unpaidLines = ledger.filter((l) => l.lineBalance > 0);

  const [billLineId, setBillLineId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedLine = unpaidLines.find((l) => l.id === billLineId);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const { url } = await uploadFile.mutateAsync(file);
      setProofUrl(url);
    } catch {
      toast.error("Failed to upload proof of payment");
      setFileName("");
    }
  };

  const handleSubmit = async () => {
    const parsedAmount = Number(amount);
    if (!billLineId || !selectedLine) {
      toast.error("Select a fee line");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (parsedAmount > selectedLine.lineBalance) {
      toast.error(
        `Amount exceeds this line's balance of ${formatNaira(selectedLine.lineBalance)}`,
      );
      return;
    }
    if (!paymentDate) {
      toast.error("Select a payment date");
      return;
    }
    if (method === "BANK_TRANSFER" && !proofUrl) {
      toast.error("Proof of payment is required for bank transfers");
      return;
    }

    setSubmitting(true);
    try {
      await recordPayment.mutateAsync({
        studentId: bill.studentId,
        payload: {
          billLineId,
          amount: parsedAmount,
          method,
          reference: reference.trim() || undefined,
          paymentDate,
          proofUrl: proofUrl || undefined,
        },
      });
      toast.success(`Payment of ${formatNaira(parsedAmount)} recorded`);
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to record payment",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
        <p className="text-sm text-muted-foreground">
          {bill.studentName} · {bill.matricNo} · balance{" "}
          {formatNaira(bill.balance)}
        </p>

        <NotchedSelectField
          label="Fee line"
          labelClassName="bg-popover"
          value={billLineId}
          onValueChange={(value) => {
            setBillLineId(value);
            const line = unpaidLines.find((l) => l.id === value);
            if (line) setAmount(String(line.lineBalance));
          }}
          options={unpaidLines.map((l) => ({
            label: `${l.description} · balance ${formatNaira(l.lineBalance)}`,
            value: l.id,
          }))}
          placeholder="Select fee line"
        />

        <NotchedField
          label="Amount (₦)"
          labelClassName="bg-popover"
          type="number"
          min={0}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />

        <NotchedSelectField
          label="Method"
          labelClassName="bg-popover"
          value={method}
          onValueChange={(value) => setMethod(value as PaymentMethod)}
          options={METHODS}
          placeholder="Select method"
        />

        <NotchedField
          label="Reference number"
          labelClassName="bg-popover"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
        />

        <NotchedDateField
          label="Payment date"
          labelClassName="bg-popover"
          value={paymentDate}
          onValueChange={setPaymentDate}
        />

        <div>
          <p className="mb-2 text-sm text-foreground">
            Proof of payment:{" "}
            <span className="text-muted-foreground">
              {method === "BANK_TRANSFER"
                ? "required for bank transfers"
                : "optional"}
            </span>
          </p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadFile.isPending}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md"
            >
              Choose file
            </Button>
            <p className="text-sm text-muted-foreground">
              {fileName || "No file selected"}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          disabled={submitting || unpaidLines.length === 0}
          onClick={handleSubmit}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Record payment
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
