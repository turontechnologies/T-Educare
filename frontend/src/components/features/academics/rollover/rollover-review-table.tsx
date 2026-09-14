"use client";

import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ROLLOVER_DECISION_BADGE_CLASS,
  ROLLOVER_DECISION_LABELS,
} from "@/lib/rollover";
import { fullName } from "@/lib/students";
import { RolloverOverrideDialog } from "./rollover-override-dialog";
import type { RolloverDecision, RolloverStudentEntry } from "@/types/rollover";
import type { Student } from "@/types/student";

interface RolloverReviewTableProps {
  entries: RolloverStudentEntry[];
  students: Student[];
  /** Omit to render a read-only view (used by Rollover History's detail view). */
  onOverride?: (
    studentId: string,
    decision: RolloverDecision,
    reason: string | undefined,
  ) => void;
}

export function RolloverReviewTable({
  entries,
  students,
  onOverride,
}: RolloverReviewTableProps) {
  const [filter, setFilter] = useState<RolloverDecision | "all">("all");
  const [overrideTarget, setOverrideTarget] =
    useState<RolloverStudentEntry | null>(null);

  const studentById = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students],
  );

  const counts = useMemo(() => {
    const base: Record<RolloverDecision | "all", number> = {
      all: entries.length,
      promote: 0,
      "promote-carryover": 0,
      repeat: 0,
      deferred: 0,
      graduating: 0,
      hold: 0,
    };
    for (const entry of entries) base[entry.decision]++;
    return base;
  }, [entries]);

  const filtered =
    filter === "all" ? entries : entries.filter((e) => e.decision === filter);

  const filterChips: { value: RolloverDecision | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "promote", label: "Promote" },
    { value: "promote-carryover", label: "Promote + Carryover" },
    { value: "repeat", label: "Repeat" },
    { value: "deferred", label: "Deferred" },
    { value: "graduating", label: "Graduating" },
    { value: "hold", label: "Hold" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {filterChips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => setFilter(chip.value)}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === chip.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {chip.label} ({counts[chip.value]})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Passed</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead>Proposed Action</TableHead>
              {onOverride && (
                <TableHead className="text-right">Action</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((entry) => {
              const student = studentById.get(entry.studentId);
              if (!student) return null;
              return (
                <TableRow
                  key={entry.studentId}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {student.matricNo}
                  </TableCell>
                  <TableCell className="font-medium">
                    {fullName(student)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.programme}
                  </TableCell>
                  <TableCell>
                    {entry.fromLevel}
                    {entry.toLevel && entry.toLevel !== entry.fromLevel && (
                      <span className="text-muted-foreground">
                        {" "}
                        → {entry.toLevel}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.passedCourses.length}
                  </TableCell>
                  <TableCell>
                    {entry.outstandingCourses.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {entry.outstandingCourses.map((code) => (
                          <Badge
                            key={code}
                            variant="outline"
                            className="font-mono text-[10px]"
                          >
                            {code}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        className={
                          ROLLOVER_DECISION_BADGE_CLASS[entry.decision]
                        }
                      >
                        {ROLLOVER_DECISION_LABELS[entry.decision]}
                      </Badge>
                      {entry.overridden && (
                        <Badge variant="outline" className="text-[10px]">
                          Overridden
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  {onOverride && (
                    <TableCell className="text-right">
                      <button
                        type="button"
                        aria-label={`Override decision for ${fullName(student)}`}
                        onClick={() => setOverrideTarget(entry)}
                        className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-secondary transition-colors hover:bg-secondary/10"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={onOverride ? 8 : 7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No students in this category.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {onOverride && (
        <RolloverOverrideDialog
          open={!!overrideTarget}
          onOpenChange={(open) => !open && setOverrideTarget(null)}
          studentName={
            overrideTarget
              ? (() => {
                  const target = studentById.get(overrideTarget.studentId);
                  return target ? fullName(target) : "";
                })()
              : ""
          }
          currentDecision={overrideTarget?.decision ?? "promote"}
          onConfirm={(decision, reason) => {
            if (overrideTarget) {
              onOverride(overrideTarget.studentId, decision, reason);
            }
          }}
        />
      )}
    </div>
  );
}
