"use client";

import { Check, Copy, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Institution } from "@/types/institution";

interface PortalLinksDialogProps {
  institution?: Institution;
  onOpenChange: (open: boolean) => void;
}

function CopyableUrl({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2">
        <code className="flex-1 truncate text-xs text-foreground">{url}</code>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              toast.success("Link copied");
              setTimeout(() => setCopied(false), 1500);
            } catch {
              toast.error("Couldn't copy — select and copy manually");
            }
          }}
          aria-label={`Copy ${label}`}
          className="shrink-0 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? (
            <Check className="size-4 text-emerald-600" />
          ) : (
            <Copy className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export function PortalLinksDialog({
  institution,
  onOpenChange,
}: PortalLinksDialogProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const studentPortalUrl = process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL ?? "";
  const slug = institution?.slug;

  return (
    <Dialog open={!!institution} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Portal Links
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <div className="space-y-5 p-6">
          <p className="text-sm text-muted-foreground">
            {institution?.name}&apos;s own sign-in space — only this
            institution&apos;s staff and students can log in from these links,
            even with otherwise-valid credentials for another institution.
          </p>

          {slug ? (
            <>
              <CopyableUrl
                label="Staff / Admin Portal"
                url={`${siteUrl}/login/${slug}`}
              />
              <CopyableUrl
                label="Student Portal"
                url={`${studentPortalUrl}/${slug}/login`}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              This institution has no URL slug yet.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
