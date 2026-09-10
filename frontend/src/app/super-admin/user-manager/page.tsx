"use client";

import { useMemo, useState } from "react";
import {
  ArchiveRestore,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  PowerOff,
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
import { UserManagerDialog } from "@/components/features/user-manager/user-manager-dialog";
import { cn } from "@/lib/utils";
import { useUserManagersStore } from "@/store/user-managers.store";
import type { UserManagerAccount } from "@/types/user-manager";

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

export default function UserManagerPage() {
  const userManagers = useUserManagersStore((state) => state.userManagers);
  const updateUserManager = useUserManagersStore(
    (state) => state.updateUserManager,
  );
  const archiveUserManager = useUserManagersStore(
    (state) => state.archiveUserManager,
  );
  const restoreUserManager = useUserManagersStore(
    (state) => state.restoreUserManager,
  );
  const resetPassword = useUserManagersStore((state) => state.resetPassword);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<
    UserManagerAccount | undefined
  >();
  const [view, setView] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("5");
  const [page, setPage] = useState(1);
  const [pendingArchive, setPendingArchive] =
    useState<UserManagerAccount | null>(null);
  const [pendingReset, setPendingReset] = useState<UserManagerAccount | null>(
    null,
  );
  const [pendingStatus, setPendingStatus] = useState<{
    account: UserManagerAccount;
    nextActive: boolean;
  } | null>(null);

  const baseList = useMemo(
    () =>
      userManagers.filter((account) =>
        view === "archived" ? account.archivedAt : !account.archivedAt,
      ),
    [userManagers, view],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return baseList;
    return baseList.filter(
      (account) =>
        account.username.toLowerCase().includes(query) ||
        account.email.toLowerCase().includes(query) ||
        account.institutionName.toLowerCase().includes(query),
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
  const archivedCount = userManagers.filter((a) => a.archivedAt).length;

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "User manager"]} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          className="gap-1.5 rounded-md border-tertiary text-tertiary-foreground transition-transform hover:scale-[1.02] hover:bg-tertiary/10 active:scale-[0.98]"
          onClick={() => {
            setEditingAccount(undefined);
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
            : "← Back to active user managers"}
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
            <Label
              htmlFor="user-manager-search"
              className="text-muted-foreground"
            >
              Search:
            </Label>
            <Input
              id="user-manager-search"
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
                <TableHead>Username</TableHead>
                <TableHead>Assigned Institutions</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Primary</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((account) => (
                <TableRow
                  key={account.id}
                  className="animate-in fade-in duration-300"
                >
                  <TableCell className="text-muted-foreground">
                    {account.code}
                  </TableCell>
                  <TableCell className="font-medium text-secondary hover:underline">
                    {account.username}
                  </TableCell>
                  <TableCell>{account.institutionName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.phone}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateTimeLabel(account.createdAt)}
                  </TableCell>
                  <TableCell>
                    {view === "active" ? (
                      <span
                        className={cn(
                          "text-xs font-medium capitalize",
                          account.status === "active"
                            ? "text-emerald-600"
                            : "text-destructive",
                        )}
                      >
                        {account.status}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        Archived
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.isPrimaryAdmin ? "Yes" : "No"}
                  </TableCell>
                  <TableCell className="text-right">
                    {view === "active" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Actions for ${account.username}`}
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingAccount(account);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setPendingReset(account)}
                          >
                            <KeyRound className="size-3.5" />
                            Reset password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setPendingStatus({
                                account,
                                nextActive: account.status !== "active",
                              })
                            }
                          >
                            {account.status === "active" ? (
                              <PowerOff className="size-3.5" />
                            ) : (
                              <Power className="size-3.5" />
                            )}
                            {account.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setPendingArchive(account)}
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
                          restoreUserManager(account.id);
                          toast.success(`${account.username} restored`);
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
                    colSpan={9}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {view === "archived"
                      ? "No archived user managers."
                      : "No user managers match your search."}
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

      <UserManagerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={editingAccount}
      />

      <ConfirmDialog
        open={!!pendingArchive}
        onOpenChange={(open) => !open && setPendingArchive(null)}
        title="Delete this user manager?"
        description={`Are you sure you want to delete ${pendingArchive?.username}? They will be hidden from the active list, but nothing is deleted — you can restore them anytime from "View archived".`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!pendingArchive) return;
          archiveUserManager(pendingArchive.id);
          toast.success(`${pendingArchive.username} deleted`);
        }}
      />

      <ConfirmDialog
        open={!!pendingStatus}
        onOpenChange={(open) => !open && setPendingStatus(null)}
        title={
          pendingStatus?.nextActive
            ? "Activate this account?"
            : "Deactivate this account?"
        }
        description={`Are you sure you want to ${pendingStatus?.nextActive ? "activate" : "deactivate"} ${pendingStatus?.account.username}? ${pendingStatus?.nextActive ? "They will regain access immediately." : "They will lose access until reactivated."}`}
        confirmLabel={pendingStatus?.nextActive ? "Activate" : "Deactivate"}
        variant={pendingStatus?.nextActive ? "default" : "destructive"}
        onConfirm={() => {
          if (!pendingStatus) return;
          updateUserManager(pendingStatus.account.id, {
            status: pendingStatus.nextActive ? "active" : "inactive",
          });
          toast.success(
            `${pendingStatus.account.username} ${pendingStatus.nextActive ? "activated" : "deactivated"}`,
          );
        }}
      />

      <ConfirmDialog
        open={!!pendingReset}
        onOpenChange={(open) => !open && setPendingReset(null)}
        title="Reset this account's password?"
        description={`Are you sure you want to reset the password for ${pendingReset?.username}? A new password will be generated immediately.`}
        confirmLabel="Reset password"
        onConfirm={() => {
          if (!pendingReset) return;
          const newPassword = resetPassword(pendingReset.id);
          toast.success(
            `New password for ${pendingReset.username}: ${newPassword}`,
          );
        }}
      />
    </div>
  );
}
