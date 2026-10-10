"use client";

import { useMemo, useState } from "react";
import {
  ArchiveRestore,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { StatusBadge } from "@/components/shared/status-badge";
import { RoleDialog } from "@/components/features/user-management/role-dialog";
import { UserDialog } from "@/components/features/user-management/user-dialog";
import { useArchiveRole, useRestoreRole, useRoles } from "@/hooks/use-roles";
import {
  useArchiveUserManager,
  useResetUserManagerPassword,
  useRestoreUserManager,
  useUserManagers,
} from "@/hooks/use-user-managers";
import type { Role } from "@/types/role";
import type {
  UserManagerAccount,
  UserManagerStatus,
} from "@/types/user-manager";

const PAGE_SIZE_OPTIONS = ["10", "25", "50"];

const USER_STATUS_BADGE: Partial<
  Record<UserManagerStatus, { label: string; className: string }>
> = {
  active: { label: "Active", className: "bg-emerald-500/10 text-emerald-600" },
  inactive: { label: "Inactive", className: "bg-muted text-muted-foreground" },
};

export default function UserManagementPage() {
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>();
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<
    UserManagerAccount | undefined
  >();

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Admin", "User Management"]} />

      <div>
        <h1 className="text-xl font-semibold text-primary">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create roles that grant access to specific menu items, then assign
          staff to those roles — they&apos;ll only see what their role allows.
        </p>
      </div>

      <Tabs defaultValue="roles">
        <TabsList variant="line">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent
          value="roles"
          className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
        >
          <div className="flex justify-end">
            <Button
              className="gap-1.5 rounded-full transition-transform hover:scale-[1.03] active:scale-[0.98]"
              onClick={() => {
                setEditingRole(undefined);
                setRoleDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              Create Role
            </Button>
          </div>
          <div className="mt-4">
            <RolesTable
              onEdit={(role) => {
                setEditingRole(role);
                setRoleDialogOpen(true);
              }}
            />
          </div>
        </TabsContent>

        <TabsContent
          value="users"
          className="animate-in fade-in slide-in-from-bottom-1 mt-4 duration-300"
        >
          <div className="flex justify-end">
            <Button
              className="gap-1.5 rounded-full transition-transform hover:scale-[1.03] active:scale-[0.98]"
              onClick={() => {
                setEditingUser(undefined);
                setUserDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add User
            </Button>
          </div>
          <div className="mt-4">
            <UsersTable
              onEdit={(user) => {
                setEditingUser(user);
                setUserDialogOpen(true);
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      <RoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        role={editingRole}
      />
      <UserDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        user={editingUser}
      />
    </div>
  );
}

function RolesTable({ onEdit }: { onEdit: (role: Role) => void }) {
  const { data: roles = [], isLoading } = useRoles();
  const { data: usersData } = useUserManagers({ perPage: 1000 });
  const users = usersData?.data ?? [];
  const archiveRole = useArchiveRole();
  const restoreRole = useRestoreRole();

  const [view, setView] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);
  const [pendingArchive, setPendingArchive] = useState<Role | null>(null);
  const [pendingBulkArchive, setPendingBulkArchive] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const usersOnRole = (roleId: string) =>
    users.filter((user) => user.roleId === roleId).length;

  const baseList = useMemo(
    () =>
      roles.filter((role) =>
        view === "archived" ? role.archivedAt : !role.archivedAt,
      ),
    [roles, view],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return baseList;
    return baseList.filter(
      (role) =>
        role.name.toLowerCase().includes(query) ||
        (role.description ?? "").toLowerCase().includes(query),
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
  const archivedCount = roles.filter((r) => r.archivedAt).length;

  const allOnPageSelected =
    paginated.length > 0 && paginated.every((r) => selected.has(r.id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        paginated.forEach((r) => next.delete(r.id));
      } else {
        paginated.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setView((v) => (v === "active" ? "archived" : "active"));
            setPage(1);
            setSearch("");
            setSelected(new Set());
          }}
          className="cursor-pointer text-sm font-medium text-secondary hover:underline"
        >
          {view === "active"
            ? `View archived (${archivedCount})`
            : "← Back to active roles"}
        </button>
      </div>

      {view === "active" && selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-secondary/30 bg-secondary/5 px-4 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-sm font-medium text-foreground">
            {selected.size} selected
          </span>
          <button
            type="button"
            onClick={() => setPendingBulkArchive(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
            Delete Selected
          </button>
        </div>
      )}

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
            <Label htmlFor="role-search" className="text-muted-foreground">
              Filter:
            </Label>
            <Input
              id="role-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Name or description"
              className="h-8 w-56"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {view === "active" && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allOnPageSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all roles on this page"
                    />
                  </TableHead>
                )}
                <TableHead>S/N</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Menu access</TableHead>
                <TableHead>Users</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Loading roles...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                paginated.map((role, index) => (
                  <TableRow
                    key={role.id}
                    className="animate-in fade-in duration-300"
                  >
                    {view === "active" && (
                      <TableCell>
                        <Checkbox
                          checked={selected.has(role.id)}
                          onCheckedChange={() => toggleSelect(role.id)}
                          aria-label={`Select ${role.name}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground">
                      {rangeStart + index}
                    </TableCell>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="max-w-xs text-wrap text-muted-foreground">
                      {role.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {role.menuKeys.length} module
                        {role.menuKeys.length === 1 ? "" : "s"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {usersOnRole(role.id)}
                    </TableCell>
                    <TableCell className="text-right">
                      {view === "active" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label={`Actions for ${role.name}`}
                            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onEdit(role)}>
                              <Pencil className="size-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setPendingArchive(role)}
                            >
                              <Trash2 className="size-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await restoreRole.mutateAsync(role.id);
                              toast.success(`${role.name} restored`);
                            } catch (error) {
                              toast.error(
                                error instanceof Error
                                  ? error.message
                                  : "Failed to restore role",
                              );
                            }
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
              {!isLoading && paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {view === "archived"
                      ? "No archived roles."
                      : "No custom roles yet — every staff account has full access until you create one."}
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
        title="Delete this role?"
        description={`Are you sure you want to delete ${pendingArchive?.name}? It will be hidden and un-assignable, but nothing is lost — you can restore it from "View archived". Staff still assigned to it keep their current access until reassigned.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!pendingArchive) return;
          try {
            await archiveRole.mutateAsync(pendingArchive.id);
            toast.success(`${pendingArchive.name} deleted`);
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Failed to delete role",
            );
          }
        }}
      />

      <ConfirmDialog
        open={pendingBulkArchive}
        onOpenChange={setPendingBulkArchive}
        title={`Delete ${selected.size} roles?`}
        description={`Are you sure you want to delete the ${selected.size} selected roles? You can restore them anytime from "View archived".`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          const ids = Array.from(selected);
          try {
            await Promise.all(ids.map((id) => archiveRole.mutateAsync(id)));
            toast.success(`${ids.length} roles deleted`);
            setSelected(new Set());
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to delete selected roles",
            );
          }
        }}
      />
    </>
  );
}

function UsersTable({
  onEdit,
}: {
  onEdit: (user: UserManagerAccount) => void;
}) {
  const { data: usersData, isLoading } = useUserManagers({ perPage: 1000 });
  const users = usersData?.data ?? [];
  const { data: roles = [] } = useRoles();
  const archiveUser = useArchiveUserManager();
  const restoreUser = useRestoreUserManager();
  const resetPassword = useResetUserManagerPassword();

  const [view, setView] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);
  const [pendingArchive, setPendingArchive] =
    useState<UserManagerAccount | null>(null);
  const [pendingBulkArchive, setPendingBulkArchive] = useState(false);
  const [pendingReset, setPendingReset] = useState<UserManagerAccount | null>(
    null,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const roleName = (roleId?: string | null) =>
    roles.find((role) => role.id === roleId)?.name ?? "Full access";

  const baseList = useMemo(
    () =>
      users.filter((user) =>
        view === "archived" ? user.archivedAt : !user.archivedAt,
      ),
    [users, view],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return baseList;
    return baseList.filter(
      (user) =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query),
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
  const archivedCount = users.filter((u) => u.archivedAt).length;

  const allOnPageSelected =
    paginated.length > 0 && paginated.every((u) => selected.has(u.id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        paginated.forEach((u) => next.delete(u.id));
      } else {
        paginated.forEach((u) => next.add(u.id));
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setView((v) => (v === "active" ? "archived" : "active"));
            setPage(1);
            setSearch("");
            setSelected(new Set());
          }}
          className="cursor-pointer text-sm font-medium text-secondary hover:underline"
        >
          {view === "active"
            ? `View archived (${archivedCount})`
            : "← Back to active users"}
        </button>
      </div>

      {view === "active" && selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-secondary/30 bg-secondary/5 px-4 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-sm font-medium text-foreground">
            {selected.size} selected
          </span>
          <button
            type="button"
            onClick={() => setPendingBulkArchive(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
            Delete Selected
          </button>
        </div>
      )}

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
            <Label htmlFor="user-search" className="text-muted-foreground">
              Filter:
            </Label>
            <Input
              id="user-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Name, email, or username"
              className="h-8 w-56"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {view === "active" && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allOnPageSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all users on this page"
                    />
                  </TableHead>
                )}
                <TableHead>S/N</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Loading users...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                paginated.map((user, index) => (
                  <TableRow
                    key={user.id}
                    className="animate-in fade-in duration-300"
                  >
                    {view === "active" && (
                      <TableCell>
                        <Checkbox
                          checked={selected.has(user.id)}
                          onCheckedChange={() => toggleSelect(user.id)}
                          aria-label={`Select ${user.firstName} ${user.lastName}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground">
                      {rangeStart + index}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {user.code}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                          {user.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.avatarUrl}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="size-full object-cover"
                            />
                          ) : (
                            <User className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-medium">
                          {user.firstName} {user.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {roleName(user.roleId)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={user.status}
                        map={USER_STATUS_BADGE}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {view === "active" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label={`Actions for ${user.firstName} ${user.lastName}`}
                            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-open:bg-muted data-open:text-foreground"
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onEdit(user)}>
                              <Pencil className="size-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setPendingReset(user)}
                            >
                              <KeyRound className="size-3.5" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setPendingArchive(user)}
                            >
                              <Trash2 className="size-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await restoreUser.mutateAsync(user.id);
                              toast.success(
                                `${user.firstName} ${user.lastName} restored`,
                              );
                            } catch (error) {
                              toast.error(
                                error instanceof Error
                                  ? error.message
                                  : "Failed to restore user",
                              );
                            }
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
              {!isLoading && paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {view === "archived"
                      ? "No archived users."
                      : "No staff accounts yet."}
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
        title="Delete this user?"
        description={`Are you sure you want to delete ${pendingArchive?.firstName} ${pendingArchive?.lastName}? It will be hidden from the active list, but nothing is deleted — you can restore it anytime from "View archived".`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!pendingArchive) return;
          try {
            await archiveUser.mutateAsync(pendingArchive.id);
            toast.success(
              `${pendingArchive.firstName} ${pendingArchive.lastName} removed`,
            );
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Failed to remove user",
            );
          }
        }}
      />

      <ConfirmDialog
        open={pendingBulkArchive}
        onOpenChange={setPendingBulkArchive}
        title={`Delete ${selected.size} users?`}
        description={`Are you sure you want to delete the ${selected.size} selected users? You can restore them anytime from "View archived".`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          const ids = Array.from(selected);
          try {
            await Promise.all(ids.map((id) => archiveUser.mutateAsync(id)));
            toast.success(`${ids.length} users deleted`);
            setSelected(new Set());
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to delete selected users",
            );
          }
        }}
      />

      <ConfirmDialog
        open={!!pendingReset}
        onOpenChange={(open) => !open && setPendingReset(null)}
        title="Reset this account's password?"
        description={`Are you sure you want to reset the password for ${pendingReset?.username}? A new password will be generated immediately.`}
        confirmLabel="Reset password"
        onConfirm={async () => {
          if (!pendingReset) return;
          try {
            const { password: newPassword } = await resetPassword.mutateAsync(
              pendingReset.id,
            );
            toast.success(
              `New password for ${pendingReset.username}: ${newPassword}`,
            );
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to reset password",
            );
          }
        }}
      />
    </>
  );
}
