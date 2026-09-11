"use client";

import { useMemo, useRef, useState } from "react";
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
  NotchedComboboxField,
  NotchedField,
  NotchedSelectField,
} from "@/components/shared/notched-field";
import { Switch } from "@/components/ui/switch";
import { readFileAsDataUrl } from "@/lib/files";
import { generatePassword, generateUsername } from "@/lib/mock-generators";
import { useInstitutionsStore } from "@/store/institutions.store";
import { useUserManagersStore } from "@/store/user-managers.store";
import type {
  UserManagerAccount,
  UserManagerGender,
} from "@/types/user-manager";

const GENDER_OPTIONS: { label: string; value: UserManagerGender }[] = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

interface UserManagerFormValues {
  firstName: string;
  otherName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
}

interface UserManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing account. */
  account?: UserManagerAccount;
}

export function UserManagerDialog({
  open,
  onOpenChange,
  account,
}: UserManagerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-2xl gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <div className="flex items-center justify-between bg-primary px-6 py-4">
          <DialogTitle className="text-base font-medium text-white">
            {account ? "Edit User Manager" : "Add New User Manager"}
          </DialogTitle>
          <DialogClose className="cursor-pointer text-white/80 transition-colors hover:text-white">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Keyed so switching between "add" and "edit — account X" starts from clean defaults without an effect resetting state. */}
        {open && (
          <UserManagerForm
            key={account?.id ?? "new"}
            account={account}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function UserManagerForm({
  account,
  onDone,
}: {
  account?: UserManagerAccount;
  onDone: () => void;
}) {
  const institutions = useInstitutionsStore((state) => state.institutions);
  const activeInstitutions = useMemo(
    () => institutions.filter((institution) => !institution.archivedAt),
    [institutions],
  );
  const createUserManager = useUserManagersStore(
    (state) => state.createUserManager,
  );
  const updateUserManager = useUserManagersStore(
    (state) => state.updateUserManager,
  );

  const [gender, setGender] = useState<UserManagerGender | "">(
    account?.gender ?? "",
  );
  const [institutionName, setInstitutionName] = useState(
    account?.institutionName ?? "",
  );
  const [isPrimaryAdmin, setIsPrimaryAdmin] = useState(
    account?.isPrimaryAdmin ?? false,
  );
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    account?.avatarUrl,
  );
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, getValues, setValue, formState } =
    useForm<UserManagerFormValues>({
      defaultValues: {
        firstName: account?.firstName ?? "",
        otherName: account?.otherName ?? "",
        lastName: account?.lastName ?? "",
        email: account?.email ?? "",
        phone: account?.phone ?? "",
        username: account?.username ?? "",
        password: account?.password ?? "",
      },
    });

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) setAvatarPreview(await readFileAsDataUrl(file));
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

  const onSubmit = (values: UserManagerFormValues) => {
    if (!gender || !institutionName) {
      toast.error("Select a gender and institution to assign");
      return;
    }

    if (account) {
      updateUserManager(account.id, {
        ...values,
        gender,
        institutionName,
        isPrimaryAdmin,
        avatarUrl: avatarPreview,
      });
      toast.success(`${values.firstName} ${values.lastName} updated`);
    } else {
      createUserManager({
        ...values,
        gender,
        institutionName,
        isPrimaryAdmin,
        avatarUrl: avatarPreview,
        status: "active",
      });
      toast.success(`${values.firstName} ${values.lastName} added`);
    }
    onDone();
  };

  return (
    <>
      <form
        id="user-manager-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex max-h-[65vh] gap-6 overflow-y-auto p-6"
      >
        <div className="flex shrink-0 flex-col items-center gap-3">
          <div className="flex size-28 items-center justify-center overflow-hidden rounded-md border-2 border-secondary bg-muted">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="Profile preview"
                className="size-full object-cover"
              />
            ) : (
              <User className="size-10 text-muted-foreground" />
            )}
          </div>
          <p className="max-w-32 text-center text-xs text-muted-foreground">
            You can change your profile picture
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
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
            placeholder="e.g. Chris"
            {...register("firstName", { required: true })}
          />
          <NotchedField
            label="Other Name"
            labelClassName="bg-popover"
            placeholder="e.g. Oluwakemi"
            {...register("otherName")}
          />

          <NotchedField
            label="Last Name"
            labelClassName="bg-popover"
            placeholder="e.g. Smart"
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
            placeholder="e.g. solomon.odogun@gmail.com"
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
              placeholder="user_chris"
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              }
              {...register("password", { required: true })}
            />
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="cursor-pointer rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Generate password
            </button>
          </div>

          <NotchedComboboxField
            label="Assign to University"
            labelClassName="bg-popover"
            value={institutionName}
            onValueChange={setInstitutionName}
            options={activeInstitutions.map((institution) => ({
              label: institution.name,
              value: institution.name,
            }))}
            placeholder="Select institution"
            searchPlaceholder="Search institutions…"
            emptyText="No institution found."
          />

          <div className="flex items-center gap-2.5">
            <Switch
              checked={isPrimaryAdmin}
              onCheckedChange={setIsPrimaryAdmin}
              id="is-primary-admin"
            />
            <Label htmlFor="is-primary-admin" className="cursor-pointer">
              Make as primary Admin
            </Label>
          </div>
        </div>
      </form>

      <div className="flex items-center justify-end gap-4 border-t border-border bg-muted/50 px-6 py-4">
        <DialogClose className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Cancel
        </DialogClose>
        <Button
          type="submit"
          form="user-manager-form"
          disabled={formState.isSubmitting}
          className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Submit
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
