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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRbacStore } from "@/store/rbac.store";
import type { ManagedUser } from "@/types/rbac";

interface UserFormValues {
  name: string;
  email: string;
}

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: ManagedUser;
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Edit user" : "Add user"}</DialogTitle>
        </DialogHeader>
        {/* Keyed by the user being edited (or "new") so each open starts
            from the right defaults without an effect resetting state. */}
        {open && (
          <UserForm
            key={user?.id ?? "new"}
            user={user}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function UserForm({
  user,
  onDone,
}: {
  user?: ManagedUser;
  onDone: () => void;
}) {
  const roles = useRbacStore((state) => state.roles);
  const createUser = useRbacStore((state) => state.createUser);
  const updateUser = useRbacStore((state) => state.updateUser);
  const [roleId, setRoleId] = useState(user?.roleId ?? roles[0]?.id ?? "");

  const { register, handleSubmit, formState } = useForm<UserFormValues>({
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "" },
  });

  const onSubmit = (values: UserFormValues) => {
    if (!roleId) {
      toast.error("Select a role for this user");
      return;
    }
    if (user) {
      updateUser(user.id, { ...values, roleId });
      toast.success(`${values.name} updated`);
    } else {
      createUser({ ...values, roleId, status: "active" });
      toast.success(`${values.name} added`);
    }
    onDone();
  };

  return (
    <>
      <form
        id="user-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="user-name">Full name</Label>
          <Input
            id="user-name"
            placeholder="e.g. Amara Bello"
            {...register("name", { required: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-email">Email</Label>
          <Input
            id="user-email"
            type="email"
            placeholder="name@institution.edu"
            {...register("email", { required: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-role">Role</Label>
          <Select
            value={roleId}
            onValueChange={(value) => setRoleId(value ?? "")}
          >
            <SelectTrigger id="user-role" className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </form>
      <DialogFooter>
        <Button
          type="submit"
          form="user-form"
          disabled={formState.isSubmitting}
          className="rounded-full"
        >
          {user ? "Save changes" : "Add user"}
        </Button>
      </DialogFooter>
    </>
  );
}
