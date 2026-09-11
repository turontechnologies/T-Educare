"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotchedField } from "@/components/shared/notched-field";

interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordCardProps {
  /** The account's live stored password, to validate "current password" against. */
  currentPassword: string;
  onChangePassword: (newPassword: string) => void;
}

/** Shared "Change Password" form — same on both profile pages; the caller supplies the live current password and where the new one gets saved. */
export function ChangePasswordCard({
  currentPassword,
  onChangePassword,
}: ChangePasswordCardProps) {
  const [revealCurrent, setRevealCurrent] = useState(false);
  const [revealNext, setRevealNext] = useState(false);
  const [revealConfirm, setRevealConfirm] = useState(false);

  const { register, handleSubmit, reset, formState } =
    useForm<ChangePasswordFormValues>({
      defaultValues: {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      },
    });

  const onSubmit = (values: ChangePasswordFormValues) => {
    if (values.currentPassword !== currentPassword) {
      toast.error("Current password is incorrect");
      return;
    }
    if (values.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (values.newPassword !== values.confirmPassword) {
      toast.error("New password and confirmation don't match");
      return;
    }
    onChangePassword(values.newPassword);
    toast.success("Password updated");
    reset();
  };

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both delay-150 duration-500">
      <CardHeader>
        <CardTitle className="text-primary">Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
          <NotchedField
            label="Current Password"
            type={revealCurrent ? "text" : "password"}
            placeholder="Enter current password"
            endAdornment={
              <button
                type="button"
                onClick={() => setRevealCurrent((v) => !v)}
                aria-label={revealCurrent ? "Hide password" : "Show password"}
                className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
              >
                {revealCurrent ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            }
            {...register("currentPassword", { required: true })}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <NotchedField
              label="New Password"
              type={revealNext ? "text" : "password"}
              placeholder="Enter new password"
              endAdornment={
                <button
                  type="button"
                  onClick={() => setRevealNext((v) => !v)}
                  aria-label={revealNext ? "Hide password" : "Show password"}
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                >
                  {revealNext ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              }
              {...register("newPassword", { required: true })}
            />
            <NotchedField
              label="Confirm New Password"
              type={revealConfirm ? "text" : "password"}
              placeholder="Re-enter new password"
              endAdornment={
                <button
                  type="button"
                  onClick={() => setRevealConfirm((v) => !v)}
                  aria-label={revealConfirm ? "Hide password" : "Show password"}
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                >
                  {revealConfirm ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              }
              {...register("confirmPassword", { required: true })}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={formState.isSubmitting}
              className="gap-2 rounded-full px-6 transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Update Password
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
