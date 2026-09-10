"use client";

import { useState } from "react";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
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
import { PageHeader } from "@/components/shared/page-header";
import { RoleDialog } from "@/components/features/user-management/role-dialog";
import { UserDialog } from "@/components/features/user-management/user-dialog";
import { useRbacStore } from "@/store/rbac.store";
import type { ManagedUser, Role } from "@/types/rbac";

export default function UserManagementPage() {
  const roles = useRbacStore((state) => state.roles);
  const users = useRbacStore((state) => state.users);
  const deleteRole = useRbacStore((state) => state.deleteRole);
  const deleteUser = useRbacStore((state) => state.deleteUser);

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>();
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | undefined>();

  const roleName = (roleId: string) =>
    roles.find((role) => role.id === roleId)?.name ?? "—";

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
                {roles.map((role) => (
                  <TableRow
                    key={role.id}
                    className="animate-in fade-in duration-300"
                  >
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        {role.name}
                        {role.isSystem && (
                          <ShieldCheck className="size-3.5 text-secondary" />
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs text-wrap text-muted-foreground">
                      {role.description}
                    </TableCell>
                    <TableCell>
                      {role.isSystem ? (
                        <Badge variant="secondary">All modules</Badge>
                      ) : (
                        <Badge variant="outline">
                          {role.menuKeys.length} module
                          {role.menuKeys.length === 1 ? "" : "s"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{usersOnRole(role.id)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${role.name}`}
                          disabled={role.isSystem}
                          onClick={() => {
                            setEditingRole(role);
                            setRoleDialogOpen(true);
                          }}
                          className="inline-flex size-7 items-center justify-center rounded-md text-secondary transition-colors hover:bg-secondary/10 disabled:pointer-events-none disabled:opacity-30"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${role.name}`}
                          disabled={role.isSystem}
                          onClick={() => {
                            deleteRole(role.id);
                            toast.success(`${role.name} deleted`);
                          }}
                          className="inline-flex size-7 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-30"
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
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="animate-in fade-in duration-300"
                  >
                    <TableCell className="font-medium">{user.name}</TableCell>
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
                          aria-label={`Edit ${user.name}`}
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
                          aria-label={`Delete ${user.name}`}
                          onClick={() => {
                            deleteUser(user.id);
                            toast.success(`${user.name} removed`);
                          }}
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
    </div>
  );
}
