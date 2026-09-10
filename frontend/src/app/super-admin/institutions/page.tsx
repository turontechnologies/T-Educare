"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Eye,
  EyeOff,
  Pencil,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
import { InstitutionDialog } from "@/components/features/institutions/institution-dialog";
import { cn } from "@/lib/utils";
import { useInstitutionsStore } from "@/store/institutions.store";
import type { Institution } from "@/types/institution";

const PAGE_SIZE_OPTIONS = ["5", "10", "25", "50"];

const dateTimeLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
    .format(new Date(iso))
    .replace(/ /g, "-") +
  ", " +
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));

const dateOnlyLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
    .format(new Date(iso))
    .replace(/ /g, "-");

export default function InstitutionsPage() {
  const institutions = useInstitutionsStore((state) => state.institutions);
  const updateInstitution = useInstitutionsStore(
    (state) => state.updateInstitution,
  );
  const archiveInstitution = useInstitutionsStore(
    (state) => state.archiveInstitution,
  );
  const restoreInstitution = useInstitutionsStore(
    (state) => state.restoreInstitution,
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<
    Institution | undefined
  >();
  const [view, setView] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("5");
  const [page, setPage] = useState(1);
  const [revealedTokens, setRevealedTokens] = useState<Set<string>>(new Set());
  const [pendingStatus, setPendingStatus] = useState<{
    institution: Institution;
    nextActive: boolean;
  } | null>(null);
  const [pendingArchive, setPendingArchive] = useState<Institution | null>(
    null,
  );

  const baseList = useMemo(
    () =>
      institutions.filter((institution) =>
        view === "archived" ? institution.archivedAt : !institution.archivedAt,
      ),
    [institutions, view],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return baseList;
    return baseList.filter(
      (institution) =>
        institution.name.toLowerCase().includes(query) ||
        institution.adminUser.toLowerCase().includes(query),
    );
  }, [baseList, search]);

  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * size,
    currentPage * size,
  );
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * size + 1;
  const rangeEnd = Math.min(currentPage * size, filtered.length);
  const archivedCount = institutions.filter((i) => i.archivedAt).length;

  const toggleTokenReveal = (id: string) => {
    setRevealedTokens((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Institutions"]} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground transition-transform hover:scale-[1.02] hover:bg-tertiary/10 active:scale-[0.98]"
          onClick={() => {
            setEditingInstitution(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add New
        </Button>

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
            : "← Back to active institutions"}
        </button>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardHeader className="flex-row items-center justify-between gap-4">
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
              htmlFor="institution-search"
              className="text-muted-foreground"
            >
              Search:
            </Label>
            <Input
              id="institution-search"
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
                <TableHead>ID</TableHead>
                <TableHead>Name of Institution</TableHead>
                <TableHead>Modules No.</TableHead>
                <TableHead>License Type</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Expiring Date</TableHead>
                <TableHead>Admin User</TableHead>
                <TableHead>Token Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((institution) => {
                const revealed = revealedTokens.has(institution.id);
                return (
                  <TableRow
                    key={institution.id}
                    className="animate-in fade-in duration-300"
                  >
                    <TableCell className="text-muted-foreground">
                      {institution.code}
                    </TableCell>
                    <TableCell className="font-medium text-secondary hover:underline">
                      {institution.name}
                    </TableCell>
                    <TableCell>{institution.modulesCount}</TableCell>
                    <TableCell>{institution.licenseType}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {dateTimeLabel(institution.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {institution.expiringAt
                        ? dateOnlyLabel(institution.expiringAt)
                        : "-"}
                    </TableCell>
                    <TableCell>{institution.adminUser}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => toggleTokenReveal(institution.id)}
                        aria-label={
                          revealed ? "Hide token key" : "Show token key"
                        }
                        className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted"
                      >
                        {revealed ? institution.tokenKey : "••••••••••"}
                        {revealed ? (
                          <EyeOff className="size-3.5 shrink-0" />
                        ) : (
                          <Eye className="size-3.5 shrink-0" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      {view === "active" ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={institution.status === "active"}
                            onCheckedChange={(checked) =>
                              setPendingStatus({
                                institution,
                                nextActive: checked,
                              })
                            }
                          />
                          <span
                            className={cn(
                              "text-xs font-medium capitalize",
                              institution.status === "active"
                                ? "text-emerald-600"
                                : "text-muted-foreground",
                            )}
                          >
                            {institution.status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">
                          Archived
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {view === "active" ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            aria-label={`Edit ${institution.name}`}
                            onClick={() => {
                              setEditingInstitution(institution);
                              setDialogOpen(true);
                            }}
                            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-secondary transition-colors hover:bg-secondary/10"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Archive ${institution.name}`}
                            onClick={() => setPendingArchive(institution)}
                            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Archive className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            restoreInstitution(institution.id);
                            toast.success(`${institution.name} restored`);
                          }}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-secondary transition-colors hover:bg-secondary/10"
                        >
                          <ArchiveRestore className="size-3.5" />
                          Restore
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {view === "archived"
                      ? "No archived institutions."
                      : "No institutions match your search."}
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

      <InstitutionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        institution={editingInstitution}
      />

      <ConfirmDialog
        open={!!pendingStatus}
        onOpenChange={(open) => !open && setPendingStatus(null)}
        title={
          pendingStatus?.nextActive
            ? "Activate this institution?"
            : "Deactivate this institution?"
        }
        description={`Are you sure you want to ${pendingStatus?.nextActive ? "activate" : "deactivate"} ${pendingStatus?.institution.name}? ${pendingStatus?.nextActive ? "It will regain full access immediately." : "It will lose access until reactivated."}`}
        confirmLabel={pendingStatus?.nextActive ? "Activate" : "Deactivate"}
        variant={pendingStatus?.nextActive ? "default" : "destructive"}
        onConfirm={() => {
          if (!pendingStatus) return;
          updateInstitution(pendingStatus.institution.id, {
            status: pendingStatus.nextActive ? "active" : "inactive",
          });
          toast.success(
            `${pendingStatus.institution.name} ${pendingStatus.nextActive ? "activated" : "deactivated"}`,
          );
        }}
      />

      <ConfirmDialog
        open={!!pendingArchive}
        onOpenChange={(open) => !open && setPendingArchive(null)}
        title="Archive this institution?"
        description={`Are you sure you want to archive ${pendingArchive?.name}? It will be hidden from the active list, but nothing is deleted — you can restore it anytime from "View archived".`}
        confirmLabel="Archive"
        variant="destructive"
        onConfirm={() => {
          if (!pendingArchive) return;
          archiveInstitution(pendingArchive.id);
          toast.success(`${pendingArchive.name} archived`);
        }}
      />
    </div>
  );
}
