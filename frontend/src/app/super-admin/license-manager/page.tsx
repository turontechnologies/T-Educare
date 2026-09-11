"use client";

import { useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
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
import { LicenseManagerDialog } from "@/components/features/license-manager/license-manager-dialog";
import { generateKey } from "@/lib/mock-generators";
import { useInstitutionsStore } from "@/store/institutions.store";
import type { Institution } from "@/types/institution";

const PAGE_SIZE_OPTIONS = ["5", "10", "25", "50"];

const dateOnlyLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
    .format(new Date(iso))
    .replace(/ /g, "-");

export default function LicenseManagerPage() {
  const institutions = useInstitutionsStore((state) => state.institutions);
  const updateInstitution = useInstitutionsStore(
    (state) => state.updateInstitution,
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstitutionId, setEditingInstitutionId] = useState<
    string | undefined
  >();
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("5");
  const [page, setPage] = useState(1);
  const [revealedTokens, setRevealedTokens] = useState<Set<string>>(new Set());
  const [pendingRegenerate, setPendingRegenerate] =
    useState<Institution | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<Institution | null>(null);

  const licensed = useMemo(
    () =>
      institutions.filter(
        (institution) => !institution.archivedAt && institution.licenseKey,
      ),
    [institutions],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return licensed;
    return licensed.filter((institution) =>
      institution.name.toLowerCase().includes(query),
    );
  }, [licensed, search]);

  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * size,
    currentPage * size,
  );
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * size + 1;
  const rangeEnd = Math.min(currentPage * size, filtered.length);

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
      <PageHeader breadcrumb={["Administrator", "License Manager"]} />

      <Button
        variant="outline"
        className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground transition-transform hover:scale-[1.02] hover:bg-tertiary/10 active:scale-[0.98]"
        onClick={() => {
          setEditingInstitutionId(undefined);
          setDialogOpen(true);
        }}
      >
        <Plus className="size-4" />
        Add New
      </Button>

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
              htmlFor="license-manager-search"
              className="text-muted-foreground"
            >
              Search:
            </Label>
            <Input
              id="license-manager-search"
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
                <TableHead>Institutions</TableHead>
                <TableHead>License Type</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Expiring Date</TableHead>
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
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingInstitutionId(institution.id);
                          setDialogOpen(true);
                        }}
                        className="cursor-pointer font-medium text-secondary hover:underline"
                      >
                        {institution.name}
                      </button>
                    </TableCell>
                    <TableCell>{institution.licenseType}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {institution.licenseKey}
                    </TableCell>
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
                    <TableCell className="text-muted-foreground">
                      {institution.licenseIssuedAt
                        ? dateOnlyLabel(institution.licenseIssuedAt)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {institution.expiringAt
                        ? dateOnlyLabel(institution.expiringAt)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Actions for ${institution.name}`}
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingInstitutionId(institution.id);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setPendingRegenerate(institution)}
                          >
                            <KeyRound className="size-3.5" />
                            Regenerate key
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setPendingRevoke(institution)}
                          >
                            <Trash2 className="size-3.5" />
                            Revoke license
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No licenses have been created yet.
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

      <LicenseManagerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        institutionId={editingInstitutionId}
      />

      <ConfirmDialog
        open={!!pendingRegenerate}
        onOpenChange={(open) => !open && setPendingRegenerate(null)}
        title="Regenerate this license key?"
        description={`Are you sure you want to regenerate the license key for ${pendingRegenerate?.name}? The old key will stop working immediately.`}
        confirmLabel="Regenerate key"
        onConfirm={() => {
          if (!pendingRegenerate) return;
          updateInstitution(pendingRegenerate.id, {
            licenseKey: generateKey(),
          });
          toast.success(
            `License key regenerated for ${pendingRegenerate.name}`,
          );
        }}
      />

      <ConfirmDialog
        open={!!pendingRevoke}
        onOpenChange={(open) => !open && setPendingRevoke(null)}
        title="Revoke this license?"
        description={`Are you sure you want to revoke the license for ${pendingRevoke?.name}? It will be reset to Basic with no license key — you can create a new one anytime from "Add New".`}
        confirmLabel="Revoke"
        variant="destructive"
        onConfirm={() => {
          if (!pendingRevoke) return;
          updateInstitution(pendingRevoke.id, {
            licenseType: "Basic",
            licenseKey: null,
            expiringAt: null,
            licenseIssuedAt: null,
          });
          toast.success(`License revoked for ${pendingRevoke.name}`);
        }}
      />
    </div>
  );
}
