"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FeeDialog } from "./fee-dialog";
import { useArchiveFeeType, useFeeTypes } from "@/hooks/use-finance";
import { useAcademicsStore } from "@/store/academics.store";
import type { FeeType } from "@/types/finance";

const PAGE_SIZE_OPTIONS = ["5", "10", "25", "50"];

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function latePenaltyLabel(fee: FeeType) {
  if (fee.latePenaltyType === "NONE" || fee.latePenaltyValue == null) {
    return "None";
  }
  if (fee.latePenaltyType === "FLAT") {
    return `${formatNaira(fee.latePenaltyValue)} flat after due date`;
  }
  return `${fee.latePenaltyValue}% of fee after due date`;
}

export function FeeStructurePanel() {
  const sessions = useAcademicsStore((state) => state.sessions);
  const { data: feeTypes = [] } = useFeeTypes();
  const archiveFeeType = useArchiveFeeType();

  const [sessionId, setSessionId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FeeType | undefined>();
  const [removing, setRemoving] = useState<FeeType | undefined>();

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);

  const activeSessions = useMemo(
    () => sessions.filter((s) => !s.archivedAt),
    [sessions],
  );
  const effectiveSessionId =
    sessionId ||
    activeSessions.find((s) => s.isCurrent)?.id ||
    activeSessions[0]?.id ||
    "";

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return feeTypes
      .filter(
        (f) =>
          !effectiveSessionId || f.academicSessionId === effectiveSessionId,
      )
      .filter(
        (f) =>
          !query ||
          f.name.toLowerCase().includes(query) ||
          f.code.toLowerCase().includes(query),
      );
  }, [feeTypes, effectiveSessionId, search]);

  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * size,
    currentPage * size,
  );
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * size + 1;
  const rangeEnd = Math.min(currentPage * size, filtered.length);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Label className="text-muted-foreground">Session</Label>
          <Select
            value={effectiveSessionId}
            onValueChange={(value) => {
              if (value) {
                setSessionId(value);
                setPage(1);
              }
            }}
          >
            <SelectTrigger size="sm" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {activeSessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.session}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="gap-1.5 rounded-md"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add Fee
        </Button>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Show</span>
            <Select
              value={pageSize}
              onValueChange={(value) => {
                if (value) {
                  setPageSize(value);
                  setPage(1);
                }
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Label
              htmlFor="fee-structure-search"
              className="text-muted-foreground"
            >
              Search:
            </Label>
            <Input
              id="fee-structure-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="h-8 w-56"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fee Type</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Late Penalty</TableHead>
                <TableHead>Students Billed</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((fee) => (
                <TableRow
                  key={fee.id}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell>
                    <p className="font-medium text-foreground">{fee.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {fee.code}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {fee.departmentName ?? "All programmes"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {fee.levelCode ?? "All levels"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {fee.sessionLabel}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {formatNaira(fee.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(fee.dueDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {latePenaltyLabel(fee)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {fee.studentsBilled}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Actions for ${fee.name}`}
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(fee);
                            setDialogOpen(true);
                          }}
                        >
                          Edit fee
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setRemoving(fee)}
                        >
                          Delete fee
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No fees set up for this session yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            page={currentPage}
            totalPages={totalPages}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            totalCount={filtered.length}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <FeeDialog open={dialogOpen} onOpenChange={setDialogOpen} fee={editing} />

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(undefined)}
        title="Delete this fee?"
        description={`Are you sure you want to delete ${removing?.name}? Students already billed for it keep their existing charges — this only stops new billing.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!removing) return;
          try {
            await archiveFeeType.mutateAsync(removing.id);
            toast.success(`${removing.name} deleted`);
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Failed to delete fee",
            );
          }
        }}
      />
    </div>
  );
}
