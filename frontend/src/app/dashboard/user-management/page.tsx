"use client";

import { useState } from "react";
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { RoleDialog } from "@/components/features/user-management/role-dialog";
import { UserDialog } from "@/components/features/user-management/user-dialog";
import { useArchiveRole, useRoles } from "@/hooks/use-roles";
import {
  useArchiveUserManager,
  useResetUserManagerPassword,
  useUserManagers,
} from "@/hooks/use-user-managers";
import type { Role } from "@/types/role";
import type { UserManagerAccount } from "@/types/user-manager";

export default function UserManagementPage() {
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: usersData, isLoading: usersLoading } = useUserManagers({
    perPage: 1000,
  });
  const users = usersData?.data ?? [];
  const archiveRole = useArchiveRole();
  const archiveUser = useArchiveUserManager();
  const resetPassword = useResetUserManagerPassword();

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>();
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<
    UserManagerAccount | undefined
  >();
  const [pendingRoleDelete, setPendingRoleDelete] = useState<Role | null>(null);
  const [pendingUserDelete, setPendingUserDelete] =
    useState<UserManagerAccount | null>(null);
  const [pendingReset, setPendingReset] = useState<UserManagerAccount | null>(
    null,
  );

  const activeRoles = roles.filter((role) => !role.archivedAt);

  const roleName = (roleId?: string | null) =>
    activeRoles.find((role) => role.id === roleId)?.name ?? "Full access";

  const usersOnRole = (roleId: string) =>
    users.filter((user) => user.roleId === roleId).length;

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Admin", "User Management"]} />

      <div>
        <h1 className="text-xl font-semibold text-primary">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create roles that grant access to specific menu items, then assign
          staff to those roles — they&apos;ll only see what their role allows.
        </p>

        <Tabs defaultValue="roles" className="mt-6">
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

            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Menu access</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolesLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Loading roles...
                    </TableCell>
                  </TableRow>
                )}
                {!rolesLoading && activeRoles.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No custom roles yet — every staff account has full access
                      until you create one.
                    </TableCell>
                  </TableRow>
                )}
                {activeRoles.map((role) => (
                  <TableRow
                    key={role.id}
                    className="animate-in fade-in duration-300"
                  >
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
                    <TableCell>{usersOnRole(role.id)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${role.name}`}
                          onClick={() => {
                            setEditingRole(role);
                            setRoleDialogOpen(true);
                          }}
                          className="inline-flex size-7 items-center justify-center rounded-md text-secondary transition-colors hover:bg-secondary/10"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${role.name}`}
                          onClick={() => setPendingRoleDelete(role)}
                          className="inline-flex size-7 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Loading users...
                    </TableCell>
                  </TableRow>
                )}
                {!usersLoading && users.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No staff accounts yet.
                    </TableCell>
                  </TableRow>
                )}
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="animate-in fade-in duration-300"
                  >
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>{roleName(user.roleId)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "active" ? "default" : "outline"
                        }
                        className="capitalize"
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${user.firstName} ${user.lastName}`}
                          onClick={() => {
                            setEditingUser(user);
                            setUserDialogOpen(true);
                          }}
                          className="inline-flex size-7 items-center justify-center rounded-md text-secondary transition-colors hover:bg-secondary/10"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Reset password for ${user.firstName} ${user.lastName}`}
                          onClick={() => setPendingReset(user)}
                          className="inline-flex size-7 items-center justify-center rounded-md text-secondary transition-colors hover:bg-secondary/10"
                        >
                          <KeyRound className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${user.firstName} ${user.lastName}`}
                          onClick={() => setPendingUserDelete(user)}
                          className="inline-flex size-7 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </div>

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

      <ConfirmDialog
        open={!!pendingRoleDelete}
        onOpenChange={(open) => !open && setPendingRoleDelete(null)}
        title="Delete this role?"
        description={`Are you sure you want to delete ${pendingRoleDelete?.name}? It will be hidden and un-assignable, but nothing is lost — you can restore it from the backend if needed. Staff still assigned to it keep their current access until reassigned.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!pendingRoleDelete) return;
          try {
            await archiveRole.mutateAsync(pendingRoleDelete.id);
            toast.success(`${pendingRoleDelete.name} deleted`);
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Failed to delete role",
            );
          }
        }}
      />

      <ConfirmDialog
        open={!!pendingUserDelete}
        onOpenChange={(open) => !open && setPendingUserDelete(null)}
        title="Delete this user?"
        description={`Are you sure you want to delete ${pendingUserDelete?.firstName} ${pendingUserDelete?.lastName}? It will be hidden from the active list, but nothing is deleted permanently.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!pendingUserDelete) return;
          try {
            await archiveUser.mutateAsync(pendingUserDelete.id);
            toast.success(
              `${pendingUserDelete.firstName} ${pendingUserDelete.lastName} removed`,
            );
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Failed to remove user",
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
    </div>
  );
}
