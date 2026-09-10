"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotchedField } from "@/components/shared/notched-field";
import { useLogin } from "@/hooks/use-login";
import {
  loginSchema,
  type LoginFormValues,
} from "@/lib/validations/auth.schema";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => login(values))}
      noValidate
      className="w-full space-y-6"
    >
      <NotchedField
        label="Username"
        autoComplete="username"
        placeholder="Turon_Admin"
        error={errors.username?.message}
        {...register("username")}
      />

      <NotchedField
        label="Password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        placeholder="Enter Password"
        error={errors.password?.message}
        endAdornment={
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
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
        {...register("password")}
      />

      <div className="flex items-center justify-between gap-4 pt-1">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-foreground/70 transition-colors hover:text-primary"
        >
          Forgot Password?
        </Link>

        <Button
          type="submit"
          disabled={isPending}
          className="h-11 gap-2 rounded-full px-6 text-sm transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
        >
          {isPending ? (
            <>
              Signing in
              <Loader2 className="size-4 animate-spin" />
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
