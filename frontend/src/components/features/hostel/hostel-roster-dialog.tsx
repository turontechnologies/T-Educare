"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { NotchedField } from "@/components/shared/notched-field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHostelRoster } from "@/hooks/use-hostels";
import type { Hostel } from "@/types/hostel";

interface HostelRosterDialogProps {
  hostel?: Hostel;
  onOpenChange: (open: boolean) => void;
}

export function HostelRosterDialog({
  hostel,
  onOpenChange,
}: HostelRosterDialogProps) {
  const { data: students = [] } = useHostelRoster(hostel?.id, {
    enabled: !!hostel,
  });

  return (
    <Dialog open={!!hostel} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-2xl gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            View Student List
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
          <NotchedField
            label="Hostel Name"
            labelClassName="bg-popover"
            value={hostel?.name ?? ""}
            readOnly
            disabled
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matric No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Room Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.studentId}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {student.matricNo}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {student.studentName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.departmentName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.roomNumber}
                  </TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No students allocated to this hostel yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
      </DialogContent>
    </Dialog>
  );
}
