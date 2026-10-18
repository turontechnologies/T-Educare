"use client";

import { useState } from "react";
import { ArchiveRestore, Pencil, Plus, Trash2 } from "lucide-react";
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
  useArchiveLeaveType,
  useLeaveTypes,
  useRestoreLeaveType,
} from "@/hooks/use-leave";
import { LeaveTypeDialog } from "./leave-type-dialog";
import type { LeaveType } from "@/types/leave";

export function LeaveTypesPanel() {
  const { data: types = [] } = useLeaveTypes();
  const archiveType = useArchiveLeaveType();
  const restoreType = useRestoreLeaveType();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveType | undefined>();
  const [pendingArchive, setPendingArchive] = useState<LeaveType | null>(null);

  const active = types.filter((t) => !t.archivedAt);
  const archived = types.filter((t) => t.archivedAt);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Leave Types</h3>
          <p className="text-xs text-muted-foreground">
            Define each leave policy — how many days per year, and whether
            unused days roll over.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add Leave Type
        </Button>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardContent className="pt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Days / Year</TableHead>
                <TableHead>Rollover</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {active.map((type) => (
                <TableRow
                  key={type.id}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {type.defaultDaysPerYear}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {type.rollover
                      ? `Yes${type.maxRolloverDays != null ? ` (max ${type.maxRolloverDays})` : " (no cap)"}`
                      : "No"}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-500/10 text-emerald-600">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(type);
                          setDialogOpen(true);
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-secondary transition-colors hover:bg-secondary/10"
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingArchive(type)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {active.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No leave types yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {archived.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Archived
              </p>
              <div className="space-y-2">
                {archived.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">{type.name}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await restoreType.mutateAsync(type.id);
                          toast.success(`${type.name} restored`);
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "Failed to restore leave type",
                          );
                        }
                      }}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-secondary transition-colors hover:bg-secondary/10"
                    >
                      <ArchiveRestore className="size-3.5" />
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <LeaveTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        leaveType={editing}
      />

      <ConfirmDialog
        open={!!pendingArchive}
        onOpenChange={(open) => !open && setPendingArchive(null)}
        title="Delete this leave type?"
        description={`Are you sure you want to delete "${pendingArchive?.name}"? Existing requests against it are kept; staff just won't be able to request it anymore. You can restore it anytime.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!pendingArchive) return;
          try {
            await archiveType.mutateAsync(pendingArchive.id);
            toast.success(`${pendingArchive.name} deleted`);
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to delete leave type",
            );
          }
        }}
      />
    </div>
  );
}
