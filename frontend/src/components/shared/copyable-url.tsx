"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

export function CopyableUrl({ label, url }: { label: string; url: string }) {
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
