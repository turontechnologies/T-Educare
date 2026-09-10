"use client";

import { useMemo, useState } from "react";
import { Link2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { InstitutionModulesDialog } from "@/components/features/modules/institution-modules-dialog";
import { cn } from "@/lib/utils";
import { useInstitutionsStore } from "@/store/institutions.store";

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

export default function ModulesPage() {
  const institutions = useInstitutionsStore((state) => state.institutions);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstitutionId, setEditingInstitutionId] = useState<
    string | undefined
  >();
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("5");
  const [page, setPage] = useState(1);

  const linked = useMemo(
    () =>
      institutions.filter(
        (institution) =>
          !institution.archivedAt && institution.moduleKeys.length > 0,
      ),
    [institutions],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return linked;
    return linked.filter((institution) =>
      institution.name.toLowerCase().includes(query),
    );
  }, [linked, search]);

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
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Modules"]} />

      <Button
        variant="outline"
        className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground transition-transform hover:scale-[1.02] hover:bg-tertiary/10 active:scale-[0.98]"
        onClick={() => {
          setEditingInstitutionId(undefined);
          setDialogOpen(true);
        }}
      >
        <Link2 className="size-4" />
        Link New Institution
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
            <Label htmlFor="modules-search" className="text-muted-foreground">
              Search:
            </Label>
            <Input
              id="modules-search"
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
                <TableHead>Assigned Institutions</TableHead>
                <TableHead>Modules Actived</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Edited</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((institution) => (
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
                  <TableCell>{institution.moduleKeys.length}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-xs font-medium capitalize",
                        institution.status === "active"
                          ? "text-emerald-600"
                          : "text-destructive",
                      )}
                    >
                      {institution.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {institution.modulesLastEditedAt
                      ? dateTimeLabel(institution.modulesLastEditedAt)
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No institutions have been linked yet.
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

      <InstitutionModulesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        institutionId={editingInstitutionId}
      />
    </div>
  );
}
