"use client";

import { useState } from "react";
import { ArrowRight, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NotchedField } from "@/components/shared/notched-field";
import {
  useMarkingGuide,
  useUpdateMarkingGuide,
} from "@/hooks/use-course-results";

interface MarkingGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ComponentRow {
  name: string;
  weight: string;
}

export function MarkingGuideDialog({
  open,
  onOpenChange,
}: MarkingGuideDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-lg gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            Marking Guide Settings
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
        {open && <MarkingGuideForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function MarkingGuideForm({ onDone }: { onDone: () => void }) {
  const { data: guide } = useMarkingGuide();
  const updateGuide = useUpdateMarkingGuide();

  const [name, setName] = useState(guide?.name ?? "School Marking Guide");
  const [components, setComponents] = useState<ComponentRow[]>(
    guide && guide.components.length > 0
      ? guide.components.map((c) => ({
          name: c.name,
          weight: String(c.weight),
        }))
      : [{ name: "", weight: "" }],
  );

  const total = components.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  const isValid = total === 100;

  const updateRow = (
    index: number,
    field: keyof ComponentRow,
    value: string,
  ) => {
    setComponents((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const removeRow = (index: number) => {
    setComponents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Guide name is required");
      return;
    }
    const parsed = components
      .filter((c) => c.name.trim())
      .map((c) => ({ name: c.name.trim(), weight: Number(c.weight) }));
    if (parsed.length === 0) {
      toast.error("At least one component is required");
      return;
    }
    const sum = parsed.reduce((s, c) => s + c.weight, 0);
    if (sum !== 100) {
      toast.error(`Weights must sum to exactly 100 (currently ${sum})`);
      return;
    }
    try {
      await updateGuide.mutateAsync({ name: name.trim(), components: parsed });
      toast.success("Marking guide updated");
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save marking guide",
      );
    }
  };

  return (
    <>
      <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
        <NotchedField
          label="Guide Name"
          labelClassName="bg-popover"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              Assessment components
            </p>
            <p className="text-xs text-muted-foreground">
              Name each part of the score and set its weight. Rename, add or
              remove freely.
            </p>
          </div>
          <Badge
            className={
              isValid
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-amber-500/10 text-amber-600"
            }
          >
            Total {total}/100
          </Badge>
        </div>

        <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
          <Label className="col-span-1 text-xs text-muted-foreground">
            Component name
          </Label>
          <Label className="col-span-1 text-xs text-muted-foreground">
            Weight
          </Label>
          <span className="col-span-1" />
          {components.map((row, index) => (
            <ComponentRowInputs
              key={index}
              row={row}
              onChange={(field, value) => updateRow(index, field, value)}
              onRemove={
                components.length > 1 ? () => removeRow(index) : undefined
              }
            />
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setComponents((prev) => [...prev, { name: "", weight: "" }])
          }
          className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground"
        >
          <Plus className="size-3.5" />
          Add component
        </Button>
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="button"
          disabled={updateGuide.isPending}
          onClick={handleSave}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Save
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}

function ComponentRowInputs({
  row,
  onChange,
  onRemove,
}: {
  row: ComponentRow;
  onChange: (field: keyof ComponentRow, value: string) => void;
  onRemove?: () => void;
}) {
  return (
    <>
      <Input
        value={row.name}
        onChange={(event) => onChange("name", event.target.value)}
        className="col-span-1 h-10"
      />
      <div className="relative col-span-1">
        <Input
          type="number"
          min={0}
          max={100}
          value={row.weight}
          onChange={(event) => onChange("weight", event.target.value)}
          className="h-10 pr-7"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
          %
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={!onRemove}
        className="col-span-1 size-10 shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-30"
      >
        <Trash2 className="size-4" />
      </Button>
    </>
  );
}
