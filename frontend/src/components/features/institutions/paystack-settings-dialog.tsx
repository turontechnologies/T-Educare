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
import {
  usePaystackSettings,
  useUpdatePaystackSettings,
} from "@/hooks/use-paystack-settings";
import type { Institution } from "@/types/institution";

interface PaystackSettingsDialogProps {
  institution?: Institution;
  onOpenChange: (open: boolean) => void;
}

export function PaystackSettingsDialog({
  institution,
  onOpenChange,
}: PaystackSettingsDialogProps) {
  return (
    <Dialog open={!!institution} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Paystack Settings
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {institution && (
          <PaystackSettingsForm
            key={institution.id}
            institution={institution}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PaystackSettingsForm({
  institution,
  onDone,
}: {
  institution: Institution;
  onDone: () => void;
}) {
  const { data: settings } = usePaystackSettings(institution.id);
  const updateSettings = useUpdatePaystackSettings();

  const [publicKey, setPublicKey] = useState(settings?.publicKey ?? "");
  const [secretKey, setSecretKey] = useState("");
  const [enabled, setEnabled] = useState(settings?.enabled ?? true);
  const [submitting, setSubmitting] = useState(false);

  const webhookUrl =
    typeof window !== "undefined"
      ? `${process.env.NEXT_PUBLIC_API_URL ?? ""}/financials/paystack/webhook/${institution.id}`
      : "";

  const handleSubmit = async () => {
    if (!publicKey.trim()) {
      toast.error("Public key is required");
      return;
    }
    if (!secretKey.trim() && !settings?.hasSecretKey) {
      toast.error("Secret key is required");
      return;
    }

    setSubmitting(true);
    try {
      await updateSettings.mutateAsync({
        institutionId: institution.id,
        payload: {
          publicKey: publicKey.trim(),
          secretKey: secretKey.trim(),
          enabled,
        },
      });
      toast.success(`Paystack settings saved for ${institution.name}`);
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-5 p-6">
        <p className="text-sm text-muted-foreground">
          {institution.name} — online payment for Student Bills. The secret key
          is stored server-side only and is never shown again once set.
        </p>

        <NotchedField
          label="Public key"
          labelClassName="bg-popover"
          placeholder="pk_test_..."
          value={publicKey}
          onChange={(event) => setPublicKey(event.target.value)}
        />
        <NotchedField
          label={
            settings?.hasSecretKey
              ? "Secret key (leave blank to keep current)"
              : "Secret key"
          }
          labelClassName="bg-popover"
          type="password"
          placeholder={settings?.hasSecretKey ? "••••••••••••" : "sk_test_..."}
          value={secretKey}
          onChange={(event) => setSecretKey(event.target.value)}
        />

        <div className="flex items-center gap-2">
          <Checkbox
            id="paystack-enabled"
            checked={enabled}
            onCheckedChange={(checked) => setEnabled(checked === true)}
          />
          <Label htmlFor="paystack-enabled" className="text-sm font-normal">
            Enable online payments for this institution
          </Label>
        </div>

        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs font-medium text-foreground">Webhook URL</p>
          <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
            {webhookUrl}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Register this exact URL in the institution&apos;s own Paystack
            dashboard.
          </p>
        </div>
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
