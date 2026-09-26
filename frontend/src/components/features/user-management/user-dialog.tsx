"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, Eye, EyeOff, Upload, User, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import { readFileAsDataUrl } from "@/lib/files";
import { generatePassword, generateUsername } from "@/lib/mock-generators";
import {
  useCreateUserManager,
  useUpdateUserManager,
} from "@/hooks/use-user-managers";
import { useRoles } from "@/hooks/use-roles";
import { useUploadFile } from "@/hooks/use-upload";
import type {
  UserManagerAccount,
  UserManagerGender,
} from "@/types/user-manager";

const GENDER_OPTIONS: { label: string; value: UserManagerGender }[] = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

/** Real Role.id, or "" for "no role — full access" (see hooks/use-roles.ts). */
const UNRESTRICTED_VALUE = "";

interface UserFormValues {
  firstName: string;
  otherName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
}

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing staff account. */
  user?: UserManagerAccount;
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-2xl gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {user ? "Edit user" : "Add user"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

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
  user?: UserManagerAccount;
  onDone: () => void;
}) {
  const { data: roles = [] } = useRoles();
  const createUserManager = useCreateUserManager();
  const updateUserManager = useUpdateUserManager();
  const uploadFile = useUploadFile();

  const [gender, setGender] = useState<UserManagerGender | "">(
    user?.gender ?? "",
  );
  const [roleId, setRoleId] = useState(user?.roleId ?? UNRESTRICTED_VALUE);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    user?.avatarUrl,
  );
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, getValues, setValue, formState } =
    useForm<UserFormValues>({
      defaultValues: {
        firstName: user?.firstName ?? "",
        otherName: user?.otherName ?? "",
        lastName: user?.lastName ?? "",
        email: user?.email ?? "",
        phone: user?.phone ?? "",
        username: user?.username ?? "",
        password: "",
      },
    });

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarUrl(await readFileAsDataUrl(file));
    try {
      const { url } = await uploadFile.mutateAsync(file);
      setAvatarUrl(url);
    } catch {
      toast.error("Failed to upload photo. Please try again.");
      setAvatarUrl(user?.avatarUrl);
    }
  };

  const handleGenerateUsername = () => {
    const { firstName, lastName } = getValues();
    if (!firstName || !lastName) {
      toast.error("Enter first and last name first");
      return;
    }
    setValue("username", generateUsername(firstName, lastName));
  };

  const handleGeneratePassword = () => {
    setValue("password", generatePassword());
    setShowPassword(true);
  };

  const onSubmit = async (values: UserFormValues) => {
    if (!gender) {
      toast.error("Select a gender");
      return;
    }
    if (uploadFile.isPending) {
      toast.error("Please wait for the photo to finish uploading.");
      return;
    }
    if (!user && !values.password) {
      toast.error("Enter or generate a password");
      return;
    }

    try {
      if (user) {
        await updateUserManager.mutateAsync({
          id: user.id,
          payload: {
            firstName: values.firstName,
            otherName: values.otherName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phone,
            username: values.username,
            gender,
            roleId,
            avatarUrl,
          },
        });
        toast.success(`${values.firstName} ${values.lastName} updated`);
      } else {
        const created = await createUserManager.mutateAsync({
          firstName: values.firstName,
          otherName: values.otherName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          username: values.username,
          password: values.password,
          gender,
          // Forced to the caller's own institution server-side regardless
          // of what's sent — this field is a required part of the shared
          // payload shape, not a real choice in this self-service context.
          institutionId: "",
          isPrimaryAdmin: false,
          avatarUrl,
        });
        if (roleId) {
          await updateUserManager.mutateAsync({
            id: created.id,
            payload: { roleId },
          });
        }
        toast.success(`${values.firstName} ${values.lastName} added`);
      }
      onDone();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  return (
    <>
      <form
        id="user-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex max-h-[65vh] gap-6 overflow-y-auto p-6"
      >
        <div className="flex shrink-0 flex-col items-center gap-3">
          <div className="flex size-28 items-center justify-center overflow-hidden rounded-md border-2 border-secondary bg-muted">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Profile preview"
                className="size-full object-cover"
              />
            ) : (
              <User className="size-10 text-muted-foreground" />
            )}
          </div>
          <p className="max-w-32 text-center text-xs text-muted-foreground">
            You can change the profile picture
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadFile.isPending}
            className="gap-1.5 rounded-md"
          >
            Upload
            <Upload className="size-3.5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="sr-only"
          />
        </div>

        <div className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-2">
          <NotchedField
            label="First Name"
            labelClassName="bg-popover"
            placeholder="e.g. Amara"
            {...register("firstName", { required: true })}
          />
          <NotchedField
            label="Other Name"
            labelClassName="bg-popover"
            placeholder="e.g. Ngozi"
            {...register("otherName")}
          />

          <NotchedField
            label="Last Name"
            labelClassName="bg-popover"
            placeholder="e.g. Bello"
            {...register("lastName", { required: true })}
          />
          <NotchedSelectField
            label="Gender"
            labelClassName="bg-popover"
            value={gender}
            onValueChange={(value) => setGender(value as UserManagerGender)}
            options={GENDER_OPTIONS}
            placeholder="Select gender"
          />

          <NotchedField
            label="Email Address"
            labelClassName="bg-popover"
            type="email"
            placeholder="e.g. amara.bello@institution.edu"
            {...register("email", { required: true })}
          />
          <NotchedField
            label="Phone Number"
            labelClassName="bg-popover"
            placeholder="e.g. 08025771099"
            {...register("phone", { required: true })}
          />

          <div className="space-y-2">
            <NotchedField
              label="Username"
              labelClassName="bg-popover"
              placeholder="user_amara"
              {...register("username", { required: true })}
            />
            <button
              type="button"
              onClick={handleGenerateUsername}
              className="cursor-pointer rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Generate username
            </button>
          </div>

          {user ? (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Password</Label>
              <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                Use the reset-password action from the table to change this
                account&apos;s password.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <NotchedField
                label="Password"
                labelClassName="bg-popover"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                }
                {...register("password", { required: !user })}
              />
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="cursor-pointer rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Generate password
              </button>
            </div>
          )}

          <NotchedSelectField
            label="Role"
            labelClassName="bg-popover"
            value={roleId}
            onValueChange={(value) => setRoleId(value ?? UNRESTRICTED_VALUE)}
            options={[
              { label: "Full access (no role)", value: UNRESTRICTED_VALUE },
              ...roles
                .filter((role) => !role.archivedAt)
                .map((role) => ({ label: role.name, value: role.id })),
            ]}
            placeholder="Select a role"
          />
        </div>
      </form>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="submit"
          form="user-form"
          disabled={formState.isSubmitting || uploadFile.isPending}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Submit
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
