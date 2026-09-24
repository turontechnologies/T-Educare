"use client";

import { Mail, Phone, User, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { UserManagerAccount } from "@/types/user-manager";

interface UserManagerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: UserManagerAccount;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium wrap-break-word text-foreground">
        {value || "—"}
      </p>
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

/** Read-only "view full details" for a row on /super-admin/user-manager — same pattern as InstitutionDetailsDialog: the username cell is styled as a link, so it needs somewhere to actually go. */
export function UserManagerDetailsDialog({
  open,
  onOpenChange,
  account,
}: UserManagerDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-2xl gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            User Manager Details
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

        {account && (
          <div className="space-y-6 p-7">
            <div className="flex items-start gap-4">
              <Avatar className="size-16 shrink-0 rounded-full" size="lg">
                <AvatarImage
                  src={account.avatarUrl}
                  alt={`${account.firstName} ${account.lastName}`}
                  className="object-cover"
                />
                <AvatarFallback className="bg-muted">
                  <User className="size-7 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1.5">
                <h3 className="text-lg font-semibold text-foreground">
                  {account.firstName} {account.otherName} {account.lastName}
                </h3>
                <p className="font-mono text-sm text-muted-foreground">
                  Code: {account.code}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-secondary/10 text-secondary">
                    {account.gender}
                  </Badge>
                  {account.isPrimaryAdmin && (
                    <Badge className="bg-tertiary/15 text-tertiary-foreground">
                      Primary Admin
                    </Badge>
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium capitalize",
                      account.status === "active"
                        ? "text-emerald-600"
                        : "text-destructive",
                    )}
                  >
                    {account.status}
                  </span>
                  {account.archivedAt && (
                    <span className="text-xs font-medium text-muted-foreground">
                      Archived
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 rounded-md border border-border bg-muted/40 p-5 text-sm">
              <Field label="Username" value={account.username} />
              <Field
                label="Assigned Institution"
                value={account.institutionName}
              />
              <div className="col-span-2 flex flex-wrap gap-x-6 gap-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="size-3.5" />
                  {account.email || "—"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="size-3.5" />
                  {account.phone || "—"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 rounded-md border border-border bg-muted/40 p-5 text-sm">
              <Field
                label="Date Created"
                value={dateLabel(account.createdAt)}
              />
              <Field
                label="Date Archived"
                value={dateLabel(account.archivedAt)}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
