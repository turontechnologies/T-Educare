"use client";

import { useRef, useState } from "react";
import { ArrowRight, FileDown, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useBulkUploadScores,
  useBulkUploadScoresTemplate,
} from "@/hooks/use-course-results";
import { cn } from "@/lib/utils";
import type { ComponentProgress } from "@/types/course-result";

interface BulkUploadScoresDialogProps {
  courseId?: string;
  academicSemesterId?: string;
  courseCode?: string;
  components: ComponentProgress[];
  onOpenChange: (open: boolean) => void;
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

export function BulkUploadScoresDialog({
  courseId,
  academicSemesterId,
  courseCode,
  components,
  onOpenChange,
}: BulkUploadScoresDialogProps) {
  const open = !!courseId && !!academicSemesterId;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <BulkUploadScoresContent
          courseId={courseId!}
          academicSemesterId={academicSemesterId!}
          courseCode={courseCode}
          components={components}
          onOpenChange={onOpenChange}
        />
      )}
    </Dialog>
  );
}

function BulkUploadScoresContent({
  courseId,
  academicSemesterId,
  courseCode,
  components,
  onOpenChange,
}: {
  courseId: string;
  academicSemesterId: string;
  courseCode?: string;
  components: ComponentProgress[];
  onOpenChange: (open: boolean) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | undefined>();
  const [dragOver, setDragOver] = useState(false);
  const bulkUpload = useBulkUploadScores();
  const downloadTemplate = useBulkUploadScoresTemplate();

  const componentList = components
    .map((c) => `${c.componentName} (${c.weight})`)
    .join(", ");

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadTemplate.mutateAsync({
        courseId,
        academicSemesterId,
      });
      downloadBlob(
        blob,
        `${(courseCode ?? "course").toLowerCase()}-scores-template.csv`,
      );
      toast.success("Template downloaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to download template",
      );
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Choose a CSV file first");
      return;
    }
    try {
      const result = await bulkUpload.mutateAsync({
        courseId,
        academicSemesterId,
        file,
      });
      toast.success(
        `${result.updated} score${result.updated === 1 ? "" : "s"} updated${
          result.skipped > 0 ? `, ${result.skipped} skipped` : ""
        }`,
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload scores",
      );
    }
  };

  return (
    <DialogContent
      showCloseButton={false}
      className="w-full max-w-md gap-0 overflow-hidden p-0"
    >
      <div className="flex items-center justify-between bg-primary px-6 py-4">
        <DialogTitle className="text-base font-medium text-white">
          Bulk Upload Scores
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

      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">
          Upload a CSV with one row per student and a column for each score
          {componentList ? `: ${componentList}.` : "."} Students are matched by
          matric number. Blank cells keep any score already recorded.
        </p>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            const dropped = event.dataTransfer.files?.[0];
            if (dropped) setFile(dropped);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 text-center transition-colors",
            dragOver
              ? "border-secondary bg-secondary/5"
              : "border-border hover:bg-muted/50",
          )}
        >
          <Upload className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {file ? file.name : "Choose a CSV file"}
          </p>
          <p className="text-xs text-muted-foreground">
            {file ? "Click or drag to replace" : "or drag it here"}
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) setFile(selected);
            event.target.value = "";
          }}
          className="sr-only"
        />

        <Button
          type="button"
          variant="link"
          className="h-auto gap-1.5 p-0 text-sm"
          disabled={downloadTemplate.isPending}
          onClick={handleDownloadTemplate}
        >
          <FileDown className="size-4" />
          Download Template
        </Button>
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          disabled={bulkUpload.isPending}
          onClick={handleUpload}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Upload scores
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </DialogContent>
  );
}
