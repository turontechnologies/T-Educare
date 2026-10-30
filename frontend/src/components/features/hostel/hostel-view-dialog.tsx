"use client";

import { Fragment } from "react";
import { Building2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NotchedField } from "@/components/shared/notched-field";
import { cn } from "@/lib/utils";
import type { Hostel } from "@/types/hostel";

interface HostelViewDialogProps {
  hostel?: Hostel;
  onOpenChange: (open: boolean) => void;
}

export function HostelViewDialog({
  hostel,
  onOpenChange,
}: HostelViewDialogProps) {
  const available = hostel ? hostel.totalBedspaces - hostel.occupiedCount : 0;

  return (
    <Dialog open={!!hostel} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-lg gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            View Hostel
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {hostel && (
          <>
            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
              <NotchedField
                label="Hostel Name"
                labelClassName="bg-popover"
                value={hostel.name}
                readOnly
                disabled
              />

              <div className="grid grid-cols-3 items-end gap-3">
                <Label className="col-span-1 text-xs text-muted-foreground">
                  Room Number
                </Label>
                <Label className="col-span-1 text-xs text-muted-foreground">
                  Capacity ( Bedspace )
                </Label>
                <Label className="col-span-1 text-xs text-muted-foreground">
                  Occupied
                </Label>
                {hostel.rooms.map((room) => {
                  const full =
                    room.capacity > 0 && room.occupiedCount >= room.capacity;
                  return (
                    <Fragment key={room.id}>
                      <div className="col-span-1 flex h-10 items-center rounded-md border border-border bg-muted px-3 text-sm text-foreground">
                        {room.roomNumber}
                      </div>
                      <div className="col-span-1 flex h-10 items-center rounded-md border border-border bg-muted px-3 text-sm text-foreground">
                        {room.capacity}
                      </div>
                      <div
                        className={cn(
                          "col-span-1 flex h-10 items-center rounded-md border border-border bg-muted px-3 text-sm",
                          full
                            ? "font-medium text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        {room.occupiedCount} / {room.capacity}
                        {full ? " · Full" : ""}
                      </div>
                    </Fragment>
                  );
                })}
                {hostel.rooms.length === 0 && (
                  <p className="col-span-3 py-4 text-center text-sm text-muted-foreground">
                    No rooms added to this hostel yet.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-md py-1.5 text-xs">
                  {hostel.totalRooms} room{hostel.totalRooms === 1 ? "" : "s"}
                </Badge>
                <Badge variant="outline" className="rounded-md py-1.5 text-xs">
                  {hostel.occupiedCount} occupied
                </Badge>
                <Badge variant="outline" className="rounded-md py-1.5 text-xs">
                  {available} available
                </Badge>
                <Badge variant="outline" className="rounded-md py-1.5 text-xs">
                  {hostel.totalBedspaces} total bedspaces
                </Badge>
              </div>

              <div>
                <p className="mb-2 text-sm text-foreground">Hostel pictures:</p>
                <div className="flex size-24 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                  {hostel.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={hostel.photoUrl}
                      alt={hostel.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Building2 className="size-8 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-border bg-muted/50 px-6 py-4">
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full px-6"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
