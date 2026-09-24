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
  onChangePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
}

/** Shared "Change Password" form — same on both profile pages; the caller decides where the change actually gets saved. */
export function ChangePasswordCard({
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

  const onSubmit = async (values: ChangePasswordFormValues) => {
    if (values.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (values.newPassword !== values.confirmPassword) {
      toast.error("New password and confirmation don't match");
      return;
    }

    try {
      await onChangePassword(values.currentPassword, values.newPassword);
      toast.success("Password updated");
      reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update password",
      );
    }
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
