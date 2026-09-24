"use client";

import { Building2, Mail, Phone, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Institution } from "@/types/institution";

interface InstitutionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution?: Institution;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

const dateLabel = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(iso))
    : "—";

/** Read-only "view full details" for a row on /super-admin/institutions — the name cell is styled as a link, so it needs somewhere to actually go (same pattern as LecturerDetailsDialog). */
export function InstitutionDetailsDialog({
  open,
  onOpenChange,
  institution,
}: InstitutionDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-lg gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Institution Details
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

        {institution && (
          <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
            <div className="flex items-start gap-4">
              <Avatar className="size-16 shrink-0 rounded-md" size="lg">
                <AvatarImage
                  src={institution.logoUrl}
                  alt={institution.name}
                  className="rounded-md object-cover"
                />
                <AvatarFallback className="rounded-md bg-muted">
                  <Building2 className="size-7 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1.5">
                <h3 className="text-lg font-semibold text-foreground">
                  {institution.name}
                </h3>
                <p className="font-mono text-sm text-muted-foreground">
                  Code: {institution.code}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-secondary/10 text-secondary">
                    {institution.institutionType}
                  </Badge>
                  <span
                    className={cn(
                      "text-xs font-medium capitalize",
                      institution.status === "active"
                        ? "text-emerald-600"
                        : "text-destructive",
                    )}
                  >
                    {institution.status}
                  </span>
                  {institution.archivedAt && (
                    <span className="text-xs font-medium text-muted-foreground">
                      Archived
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-md border border-border bg-muted/40 p-4 text-sm">
              <Field label="City" value={institution.city} />
              <Field label="Country/State" value={institution.countryState} />
              <div className="col-span-2">
                <Field label="Address" value={institution.address} />
              </div>
              <div className="col-span-2">
                <Field label="Principal" value={institution.principalName} />
              </div>
              <div className="col-span-2 flex flex-wrap gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="size-3.5" />
                  {institution.principalEmail || "—"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="size-3.5" />
                  {institution.principalPhone || "—"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-md border border-border bg-muted/40 p-4 text-sm">
              <Field label="Primary Admin" value={institution.adminUser} />
              <Field label="Admin Email" value={institution.adminEmail} />
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-md border border-border bg-muted/40 p-4 text-sm">
              <Field
                label="Modules Linked"
                value={String(institution.modulesCount)}
              />
              <Field label="License Type" value={institution.licenseType} />
              <Field
                label="License Expiring"
                value={dateLabel(institution.expiringAt)}
              />
              <Field label="License Key" value={institution.licenseKey} />
              <Field label="Token Key" value={institution.tokenKey} />
              <Field
                label="Date Created"
                value={dateLabel(institution.createdAt)}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
