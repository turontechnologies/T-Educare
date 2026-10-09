"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  ChevronRight,
  ShieldAlert,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { NotchedField } from "@/components/shared/notched-field";
import {
  useRevokeLicense,
  useStartGracePeriod,
  useSuspendLicense,
} from "@/hooks/use-institutions";
import { cn } from "@/lib/utils";
import type { Institution } from "@/types/institution";

const DEFAULT_GRACE_DAYS = 14;

type Kind = "choose" | "reset" | "grace" | "suspend";

interface RevokeLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution: Institution | null;
}

/**
 * The single "Revoke license" entry point — opens a choice between three
 * genuinely different actions rather than firing one instant, ungated
 * reset. "Reset to Basic" is the pre-existing `revoke-license` endpoint
 * (administrative cleanup, no audit-log row); "Start Grace Period" and
 * "Suspend Immediately" are the two licenseStatus actions (API_CONTRACT.md
 * §4.8) — the production-standard response to a payment problem is Grace
 * Period, not an instant cutoff; Suspend Immediately exists for severe
 * cases (fraud, etc.) where giving notice first isn't appropriate.
 */
export function RevokeLicenseDialog({
  open,
  onOpenChange,
  institution,
}: RevokeLicenseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-lg gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Revoke License
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {open && institution && (
          <RevokeLicenseFlow
            key={institution.id}
            institution={institution}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RevokeLicenseFlow({
  institution,
  onDone,
}: {
  institution: Institution;
  onDone: () => void;
}) {
  const [kind, setKind] = useState<Kind>("choose");

  if (kind === "choose") {
    return <ChooseKindStep institution={institution} onChoose={setKind} />;
  }

  return (
    <DetailsStep
      kind={kind}
      institution={institution}
      onBack={() => setKind("choose")}
      onDone={onDone}
    />
  );
}

function ChooseKindStep({
  institution,
  onChoose,
}: {
  institution: Institution;
  onChoose: (kind: Kind) => void;
}) {
  const options: {
    kind: Kind;
    icon: typeof Undo2;
    title: string;
    description: string;
  }[] = [
    {
      kind: "reset",
      icon: Undo2,
      title: "Reset to Basic",
      description:
        "Administrative cleanup — immediately clears the license type, key, and expiry back to the free Basic tier. Not for a payment issue.",
    },
    {
      kind: "grace",
      icon: ShieldAlert,
      title: "Start Grace Period",
      description:
        "The production-standard response to a payment problem. Keeps access during a countdown; auto-suspends only if it isn't renewed in time.",
    },
    {
      kind: "suspend",
      icon: Ban,
      title: "Suspend Immediately",
      description:
        "Cuts off access right away with no grace window. Reserve this for severe cases (e.g. fraud) — most payment issues should use Start Grace Period instead.",
    },
  ];

  return (
    <div className="space-y-4 p-6">
      <p className="text-sm text-muted-foreground">
        What kind of revoke is this for{" "}
        <span className="font-medium text-foreground">{institution.name}</span>?
      </p>

      <div className="space-y-2.5">
        {options.map(({ kind, icon: Icon, title, description }) => (
          <button
            key={kind}
            type="button"
            onClick={() => onChoose(kind)}
            className={cn(
              "group flex w-full cursor-pointer items-start gap-3 rounded-md border border-border p-3.5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5",
            )}
          >
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <Icon className="size-4" />
            </span>
            <span className="flex-1 space-y-0.5">
              <span className="block text-sm font-medium text-foreground">
                {title}
              </span>
              <span className="block text-xs text-muted-foreground">
                {description}
              </span>
            </span>
            <ChevronRight className="mt-1.5 size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
      </div>
    </div>
  );
}

function DetailsStep({
  kind,
  institution,
  onBack,
  onDone,
}: {
  kind: Exclude<Kind, "choose">;
  institution: Institution;
  onBack: () => void;
  onDone: () => void;
}) {
  const revokeLicense = useRevokeLicense();
  const startGracePeriod = useStartGracePeriod();
  const suspendLicense = useSuspendLicense();

  const [reason, setReason] = useState("");
  const [graceDays, setGraceDays] = useState(String(DEFAULT_GRACE_DAYS));

  const isPending =
    revokeLicense.isPending ||
    startGracePeriod.isPending ||
    suspendLicense.isPending;

  const handleBack = () => {
    setReason("");
    setGraceDays(String(DEFAULT_GRACE_DAYS));
    onBack();
  };

  const handleSubmit = async () => {
    try {
      if (kind === "reset") {
        await revokeLicense.mutateAsync(institution.id);
        toast.success(`${institution.name}'s license was reset to Basic`);
      } else if (kind === "grace") {
        if (!reason.trim()) {
          toast.error("Enter a reason for the grace period");
          return;
        }
        const parsedDays = Number(graceDays);
        if (!Number.isInteger(parsedDays) || parsedDays <= 0) {
          toast.error("Grace days must be a positive whole number");
          return;
        }
        await startGracePeriod.mutateAsync({
          id: institution.id,
          payload: { reason: reason.trim(), graceDays: parsedDays },
        });
        toast.success(`${institution.name} is now in a grace period`);
      } else {
        if (!reason.trim()) {
          toast.error("Enter a reason for the immediate suspension");
          return;
        }
        await suspendLicense.mutateAsync({
          id: institution.id,
          payload: { reason: reason.trim() },
        });
        toast.success(`${institution.name}'s license was suspended`);
      }
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    }
  };

  return (
    <>
      <div className="space-y-5 p-6">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Choose a different action
        </button>

        {kind === "reset" && (
          <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            This immediately resets{" "}
            <span className="font-medium text-foreground">
              {institution.name}
            </span>{" "}
            to the free Basic tier — no license key, no expiry, and any grace
            period or suspension is cleared. This is an administrative reset,
            not a payment-related action, and isn&apos;t recorded in the license
            history log.
          </div>
        )}

        {kind === "grace" && (
          <>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {institution.name}
              </span>{" "}
              will keep access during the grace period. If it isn&apos;t renewed
              before the deadline, the backend will automatically suspend it.
            </p>
            <NotchedField
              label="Reason"
              labelClassName="bg-popover"
              placeholder="e.g. Payment default on renewal invoice"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <NotchedField
              label="Grace period (days)"
              labelClassName="bg-popover"
              type="number"
              min={1}
              value={graceDays}
              onChange={(event) => setGraceDays(event.target.value)}
            />
          </>
        )}

        {kind === "suspend" && (
          <>
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              This cuts off{" "}
              <span className="font-medium">{institution.name}</span>
              &apos;s access immediately, with no grace window. Most payment
              issues should use Start Grace Period instead.
            </div>
            <NotchedField
              label="Reason"
              labelClassName="bg-popover"
              placeholder="e.g. Confirmed fraudulent activity"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </>
        )}
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          variant={kind === "suspend" ? "destructive" : "default"}
          disabled={isPending}
          onClick={handleSubmit}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          {kind === "reset" && "Confirm Reset"}
          {kind === "grace" && "Start Grace Period"}
          {kind === "suspend" && "Suspend Immediately"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
