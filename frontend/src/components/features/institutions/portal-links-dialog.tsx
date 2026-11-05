"use client";

import { X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { CopyableUrl } from "@/components/shared/copyable-url";
import type { Institution } from "@/types/institution";

interface PortalLinksDialogProps {
  institution?: Institution;
  onOpenChange: (open: boolean) => void;
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
