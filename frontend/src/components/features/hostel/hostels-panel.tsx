"use client";

import { useMemo, useState } from "react";
import { Building2, Eye, Plus, Pencil, Upload, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { TablePagination } from "@/components/shared/table-pagination";
import { BulkUploadHostelsDialog } from "./bulk-upload-hostels-dialog";
import { HostelDialog } from "./hostel-dialog";
import { HostelRosterDialog } from "./hostel-roster-dialog";
import { HostelViewDialog } from "./hostel-view-dialog";
import { useHostels } from "@/hooks/use-hostels";
import type { Hostel } from "@/types/hostel";

const PAGE_SIZE_OPTIONS = ["6", "12", "24"];

export function HostelsPanel() {
  const { data: hostels = [] } = useHostels();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [editing, setEditing] = useState<Hostel | undefined>();
  const [rosterFor, setRosterFor] = useState<Hostel | undefined>();
  const [viewing, setViewing] = useState<Hostel | undefined>();

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("6");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return hostels;
    return hostels.filter((h) => h.name.toLowerCase().includes(query));
  }, [hostels, search]);

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
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground"
          onClick={() => setBulkUploadOpen(true)}
        >
          <Upload className="size-4" />
          Bulk Upload
        </Button>
        <Button
          className="gap-1.5 rounded-md"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Create Hostel
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
            <Label htmlFor="hostels-search" className="text-muted-foreground">
              Search:
            </Label>
            <Input
              id="hostels-search"
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((hostel) => (
              <div
                key={hostel.id}
                className="animate-in fade-in overflow-hidden rounded-lg border border-border duration-300"
              >
                <div className="flex h-36 items-center justify-center bg-muted">
                  {hostel.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={hostel.photoUrl}
                      alt={hostel.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Building2 className="size-10 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <p className="font-medium text-foreground">{hostel.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {hostel.totalRooms} room{hostel.totalRooms === 1 ? "" : "s"}{" "}
                    · {hostel.totalBedspaces} bedspace
                    {hostel.totalBedspaces === 1 ? "" : "s"}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <Badge
                      className={
                        hostel.occupiedCount >= hostel.totalBedspaces &&
                        hostel.totalBedspaces > 0
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {hostel.occupiedCount} / {hostel.totalBedspaces} occupied
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setViewing(hostel)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditing(hostel);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setRosterFor(hostel)}
                      >
                        <Users className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {paginated.length === 0 && (
              <p className="col-span-full py-10 text-center text-muted-foreground">
                No hostels yet.
              </p>
            )}
          </div>

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

      <HostelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        hostel={editing}
      />
      <BulkUploadHostelsDialog
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
      />
      <HostelRosterDialog
        hostel={rosterFor}
        onOpenChange={() => setRosterFor(undefined)}
      />
      <HostelViewDialog
        hostel={viewing}
        onOpenChange={() => setViewing(undefined)}
      />
    </div>
  );
}
