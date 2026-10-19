"use client";

import { useRef } from "react";
import { Download, FileDown, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ImportResult {
  imported: number;
  skipped: number;
}

interface ImportExportBarProps {
  /** Used in button labels and toasts, e.g. "Courses", "Leave Requests". */
  resourceLabel: string;
  onDownloadTemplate: () => Promise<Blob>;
  onImport: (file: File) => Promise<ImportResult>;
  onExport: () => Promise<Blob>;
  templatePending?: boolean;
  importPending?: boolean;
  exportPending?: boolean;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * The Download-Template / Import / Export button row — one shared
 * implementation so every module's import/export behaves identically
 * (same toasts, same file-naming, same icon convention) instead of each
 * page re-implementing its own slightly-different version. The
 * Import-button-uses-a-Download-icon / Export-button-uses-an-Upload-icon
 * pairing looks backwards but matches the established convention already
 * used everywhere else in the app (Staff, Lecturers, Courses) — keeping it
 * here rather than "fixing" it avoids introducing a new inconsistency.
 */
export function ImportExportBar({
  resourceLabel,
  onDownloadTemplate,
  onImport,
  onExport,
  templatePending,
  importPending,
  exportPending,
}: ImportExportBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slug = resourceLabel.toLowerCase().replace(/\s+/g, "-");

  const handleDownloadTemplate = async () => {
    try {
      const blob = await onDownloadTemplate();
      downloadBlob(blob, `${slug}-template.csv`);
      toast.success(`${resourceLabel} template downloaded`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to download template",
      );
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const result = await onImport(file);
      toast.success(
        `${result.imported} ${resourceLabel.toLowerCase()} imported${
          result.skipped > 0 ? `, ${result.skipped} skipped` : ""
        }`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to import ${resourceLabel.toLowerCase()}`,
      );
    }
  };

  const handleExport = async () => {
    try {
      const blob = await onExport();
      downloadBlob(
        blob,
        `${slug}-${new Date().toISOString().slice(0, 10)}.csv`,
      );
      toast.success(`${resourceLabel} exported`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export");
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="gap-1.5 rounded-md"
        disabled={templatePending}
        onClick={handleDownloadTemplate}
      >
        <FileDown className="size-4" />
        Download Template
      </Button>
      <Button
        variant="outline"
        className="gap-1.5 rounded-md"
        disabled={importPending}
        onClick={() => fileInputRef.current?.click()}
      >
        <Download className="size-4" />
        Import {resourceLabel}
      </Button>
      <Button
        variant="outline"
        className="gap-1.5 rounded-md"
        disabled={exportPending}
        onClick={handleExport}
      >
        <Upload className="size-4" />
        Export {resourceLabel}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleImportFile(file);
          event.target.value = "";
        }}
        className="sr-only"
      />
    </>
  );
}
