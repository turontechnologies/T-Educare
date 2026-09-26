"use client";

import { useMemo, useState } from "react";
import {
  ArchiveRestore,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { ProgramDialog } from "@/components/features/academics/program-dialog";
import { useDepartmentsStore } from "@/store/departments.store";
import { useFacultiesStore } from "@/store/faculties.store";
import { useProgramsStore } from "@/store/programs.store";
import type { Program } from "@/types/program";

const PAGE_SIZE_OPTIONS = ["10", "25", "50"];

export default function ProgramManagementPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | undefined>();

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Program Management"]} />

      <div>
        <h1 className="text-xl font-semibold text-primary">
          Program Management
        </h1>

        <div className="mt-4">
          <Button
            variant="outline"
            className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground transition-transform hover:scale-[1.02] hover:bg-tertiary/10 active:scale-[0.98]"
            onClick={() => {
              setEditingProgram(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add New
          </Button>
        </div>

        <div className="mt-6">
          <ProgramTable
            onEdit={(program) => {
              setEditingProgram(program);
              setDialogOpen(true);
            }}
          />
        </div>
      </div>

      <ProgramDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        program={editingProgram}
      />
    </div>
  );
}

function ProgramTable({ onEdit }: { onEdit: (program: Program) => void }) {
  const programs = useProgramsStore((state) => state.programs);
  const archiveProgram = useProgramsStore((state) => state.archiveProgram);
  const restoreProgram = useProgramsStore((state) => state.restoreProgram);
  const departments = useDepartmentsStore((state) => state.departments);
  const faculties = useFacultiesStore((state) => state.faculties);

  const [view, setView] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);
  const [pendingArchive, setPendingArchive] = useState<Program | null>(null);

  const departmentName = (id: string) =>
    departments.find((d) => d.id === id)?.name ?? "—";
  const facultyName = (id: string) =>
    faculties.find((f) => f.id === id)?.name ?? "—";

  const baseList = useMemo(
    () =>
      programs.filter((program) =>
        view === "archived" ? program.archivedAt : !program.archivedAt,
      ),
    [programs, view],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return baseList;
    return baseList.filter(
      (program) =>
        program.name.toLowerCase().includes(query) ||
        departmentName(program.departmentId).toLowerCase().includes(query) ||
        facultyName(program.facultyId).toLowerCase().includes(query),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseList, search, departments, faculties]);

  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * size,
    currentPage * size,
  );
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * size + 1;
  const rangeEnd = Math.min(currentPage * size, filtered.length);
  const archivedCount = programs.filter((p) => p.archivedAt).length;

  return (
    <>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setView((v) => (v === "active" ? "archived" : "active"));
            setPage(1);
            setSearch("");
          }}
          className="cursor-pointer text-sm font-medium text-secondary hover:underline"
        >
          {view === "active"
            ? `View archived (${archivedCount})`
            : "← Back to active programs"}
        </button>
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
            <Label htmlFor="program-search" className="text-muted-foreground">
              Filter:
            </Label>
            <Input
              id="program-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="h-8 w-48"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S/N</TableHead>
                <TableHead>Program Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Faculty</TableHead>
                <TableHead>Program Type</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((program, index) => (
                <TableRow
                  key={program.id}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="text-muted-foreground">
                    {rangeStart + index}
                  </TableCell>
                  <TableCell className="font-medium">{program.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {departmentName(program.departmentId)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {facultyName(program.facultyId)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        program.programType === "Undergraduate"
                          ? "bg-secondary/10 text-secondary"
                          : "bg-tertiary/15 text-tertiary-foreground"
                      }
                    >
                      {program.programType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {view === "active" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Actions for ${program.name}`}
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => onEdit(program)}>
                            <Pencil className="size-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setPendingArchive(program)}
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          restoreProgram(program.id);
                          toast.success(`${program.name} restored`);
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-secondary transition-colors hover:bg-secondary/10"
                      >
                        <ArchiveRestore className="size-3.5" />
                        Restore
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {view === "archived"
                      ? "No archived programs."
                      : "No programs match your search."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>
              Showing {rangeStart} to {rangeEnd} of {filtered.length} entries
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Button
                  key={n}
                  variant={n === currentPage ? "default" : "outline"}
                  size="sm"
                  className="size-7 p-0"
                  onClick={() => setPage(n)}
                >
                  {n}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!pendingArchive}
        onOpenChange={(open) => !open && setPendingArchive(null)}
        title="Delete this program?"
        description={`Are you sure you want to delete ${pendingArchive?.name}? It will be hidden from the active list, but nothing is deleted — you can restore it anytime from "View archived".`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!pendingArchive) return;
          archiveProgram(pendingArchive.id);
          toast.success(`${pendingArchive.name} deleted`);
        }}
      />
    </>
  );
}
