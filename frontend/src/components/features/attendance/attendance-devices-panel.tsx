"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useAttendanceDevices,
  useRevokeAttendanceDevice,
} from "@/hooks/use-attendance";
import { AttendanceDeviceDialog } from "./attendance-device-dialog";
import type { AttendanceDevice } from "@/types/attendance";

export function AttendanceDevicesPanel() {
  const { data: devices = [] } = useAttendanceDevices();
  const revokeDevice = useRevokeAttendanceDevice();

  const [registerOpen, setRegisterOpen] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<
    AttendanceDevice | undefined
  >();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">
            Clock-In Devices
          </h3>
          <p className="text-xs text-muted-foreground">
            Biometric or card devices that push clock-in/clock-out events
            directly, without an admin login.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground"
          onClick={() => setRegisterOpen(true)}
        >
          <Plus className="size-4" />
          Register Device
        </Button>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardContent className="pt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow
                  key={device.id}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="font-medium">{device.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {device.location ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        device.status === "active"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {device.status === "active" ? "Active" : "Revoked"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {device.lastSeenAt
                      ? format(new Date(device.lastSeenAt), "d MMM, h:mm a")
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(device.createdAt), "d MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    {device.status === "active" && (
                      <button
                        type="button"
                        aria-label={`Revoke ${device.name}`}
                        onClick={() => setPendingRevoke(device)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                        Revoke
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {devices.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No devices registered yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AttendanceDeviceDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
      />

      <ConfirmDialog
        open={!!pendingRevoke}
        onOpenChange={(open) => !open && setPendingRevoke(undefined)}
        title="Revoke this device?"
        description={`Are you sure you want to revoke "${pendingRevoke?.name}"? Its API key will stop working immediately — it will need to be re-registered to clock staff in again.`}
        confirmLabel="Revoke"
        variant="destructive"
        onConfirm={async () => {
          if (!pendingRevoke) return;
          try {
            await revokeDevice.mutateAsync(pendingRevoke.id);
            toast.success(`${pendingRevoke.name} revoked`);
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to revoke device",
            );
          }
        }}
      />
    </div>
  );
}
