"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INSTITUTION_NAV } from "@/config/nav";
import { useRbacStore } from "@/store/rbac.store";
import type { Role } from "@/types/rbac";
import { MenuAccessTree } from "./menu-access-tree";

interface RoleFormValues {
  name: string;
  description: string;
}

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing (non-system) role. */
  role?: Role;
}

export function RoleDialog({ open, onOpenChange, role }: RoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{role ? "Edit role" : "Create role"}</DialogTitle>
        </DialogHeader>
        {/* Keyed by the role being edited (or "new") so each open starts
            from the right defaults without an effect resetting state. */}
        {open && (
          <RoleForm
            key={role?.id ?? "new"}
            role={role}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RoleForm({ role, onDone }: { role?: Role; onDone: () => void }) {
  const createRole = useRbacStore((state) => state.createRole);
  const updateRole = useRbacStore((state) => state.updateRole);
  const [menuKeys, setMenuKeys] = useState<string[]>(role?.menuKeys ?? []);

  const { register, handleSubmit, formState } = useForm<RoleFormValues>({
    defaultValues: {
      name: role?.name ?? "",
      description: role?.description ?? "",
    },
  });

  const onSubmit = (values: RoleFormValues) => {
    if (menuKeys.length === 0) {
      toast.error("Grant access to at least one menu item");
      return;
    }
    if (role) {
      updateRole(role.id, { ...values, menuKeys });
      toast.success(`${values.name} updated`);
    } else {
      createRole({ ...values, menuKeys });
      toast.success(`${values.name} role created`);
    }
    onDone();
  };

  return (
    <>
      <form
        id="role-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="role-name">Role name</Label>
          <Input
            id="role-name"
            placeholder="e.g. Front Desk Officer"
            {...register("name", { required: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role-description">Description</Label>
          <Input
            id="role-description"
            placeholder="What does this role do?"
            {...register("description", { required: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Menu access</Label>
          <p className="text-xs text-muted-foreground">
            Users assigned this role will only see the menu items checked below.
          </p>
          <MenuAccessTree
            items={INSTITUTION_NAV}
            selected={menuKeys}
            onChange={setMenuKeys}
          />
        </div>
      </form>
      <DialogFooter>
        <Button
          type="submit"
          form="role-form"
          disabled={formState.isSubmitting}
          className="rounded-full"
        >
          {role ? "Save changes" : "Create role"}
        </Button>
      </DialogFooter>
    </>
  );
}
