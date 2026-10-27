"use client";

import { useRef, useState } from "react";
import { ArrowRight, Camera, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
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
import { useUploadFile } from "@/hooks/use-upload";
import { useCreateHostel, useUpdateHostel } from "@/hooks/use-hostels";
import { readFileAsDataUrl } from "@/lib/files";
import type { Hostel } from "@/types/hostel";

interface HostelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing hostel. */
  hostel?: Hostel;
}

export function HostelDialog({
  open,
  onOpenChange,
  hostel,
}: HostelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-lg gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {hostel ? "Edit Hostel" : "Create Hostel"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {open && (
          <HostelForm
            key={hostel?.id ?? "new"}
            hostel={hostel}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface RoomRow {
  roomNumber: string;
  capacity: string;
}

function HostelForm({
  hostel,
  onDone,
}: {
  hostel?: Hostel;
  onDone: () => void;
}) {
  const createHostel = useCreateHostel();
  const updateHostel = useUpdateHostel();
  const uploadFile = useUploadFile();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(hostel?.name ?? "");
  const [rooms, setRooms] = useState<RoomRow[]>(
    hostel && hostel.rooms.length > 0
      ? hostel.rooms.map((r) => ({
          roomNumber: r.roomNumber,
          capacity: String(r.capacity),
        }))
      : [{ roomNumber: "", capacity: "" }],
  );
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(
    hostel?.photoUrl ?? undefined,
  );
  const [submitting, setSubmitting] = useState(false);

  const updateRoom = (index: number, field: keyof RoomRow, value: string) => {
    setRooms((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const removeRoom = (index: number) => {
    setRooms((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoUrl(await readFileAsDataUrl(file));
    try {
      const { url } = await uploadFile.mutateAsync(file);
      setPhotoUrl(url);
    } catch {
      toast.error("Failed to upload picture. Please try again.");
      setPhotoUrl(hostel?.photoUrl ?? undefined);
    }
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Hostel name is required");
      return;
    }
    const parsedRooms = rooms
      .filter((r) => r.roomNumber.trim())
      .map((r) => ({
        roomNumber: r.roomNumber.trim(),
        capacity: Number(r.capacity),
      }));
    if (parsedRooms.length === 0) {
      toast.error("At least one room is required");
      return;
    }
    if (
      parsedRooms.some((r) => !Number.isFinite(r.capacity) || r.capacity < 1)
    ) {
      toast.error("Every room needs a capacity of at least 1");
      return;
    }

    const payload = {
      name: trimmedName,
      rooms: parsedRooms,
      photoUrl: photoUrl ?? "",
    };

    setSubmitting(true);
    try {
      if (hostel) {
        await updateHostel.mutateAsync({ id: hostel.id, payload });
        toast.success(`${trimmedName} updated`);
      } else {
        const created = await createHostel.mutateAsync(payload);
        toast.success(`${created.name} created`);
      }
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save hostel",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
        <NotchedField
          label="Hostel Name"
          labelClassName="bg-popover"
          placeholder="e.g. Jubilee Hall"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
          <Label className="col-span-1 text-xs text-muted-foreground">
            Room Number
          </Label>
          <Label className="col-span-1 text-xs text-muted-foreground">
            Capacity ( Bedspace )
          </Label>
          <span className="col-span-1" />
          {rooms.map((room, index) => (
            <RoomRowInputs
              key={index}
              row={room}
              onChange={(field, value) => updateRoom(index, field, value)}
              onRemove={rooms.length > 1 ? () => removeRoom(index) : undefined}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setRooms((prev) => [...prev, { roomNumber: "", capacity: "" }])
          }
          className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground"
        >
          <Plus className="size-3.5" />
          Room
        </Button>

        <div>
          <p className="mb-2 text-sm text-foreground">
            Hostel pictures:{" "}
            <span className="text-muted-foreground">
              maximum size: 30mb for pictures
            </span>
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadFile.isPending}
              className="flex size-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted transition-colors hover:border-secondary"
            >
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt="Hostel preview"
                  className="size-full object-cover"
                />
              ) : (
                <Camera className="size-5 text-muted-foreground" />
              )}
            </button>
            <p className="text-sm text-muted-foreground">
              {photoUrl ? "1 picture added" : "No file selected"}
            </p>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="sr-only"
            />
          </div>
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

function RoomRowInputs({
  row,
  onChange,
  onRemove,
}: {
  row: RoomRow;
  onChange: (field: keyof RoomRow, value: string) => void;
  onRemove?: () => void;
}) {
  return (
    <>
      <Input
        placeholder="e.g. 101"
        value={row.roomNumber}
        onChange={(event) => onChange("roomNumber", event.target.value)}
        className="col-span-1 h-10"
      />
      <Input
        type="number"
        min={0}
        placeholder="0"
        value={row.capacity}
        onChange={(event) => onChange("capacity", event.target.value)}
        className="col-span-1 h-10"
      />
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
