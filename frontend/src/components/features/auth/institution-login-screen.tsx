"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Building2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthHeroPanel } from "@/components/features/auth/auth-hero-panel";
import { LoginForm } from "@/components/features/auth/login-form";
import { useInstitutionBranding } from "@/hooks/use-institution-branding";

export function InstitutionLoginScreen({ slug }: { slug: string }) {
  const {
    data: institution,
    isLoading,
    isError,
  } = useInstitutionBranding(slug);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 bg-muted text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">Loading your institution&apos;s sign-in page…</p>
      </div>
    );
  }

  if (isError || !institution) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 bg-muted px-6 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <h1 className="text-lg font-semibold text-foreground">
          We couldn&apos;t find that institution
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Double-check the link your institution gave you, or use the
          platform&apos;s{" "}
          <Link href="/login" className="font-medium text-primary underline">
            general sign-in page
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen w-full bg-background"
      style={
        institution.brandColor
          ? ({ "--primary": institution.brandColor } as React.CSSProperties)
          : undefined
      }
    >
      <AuthHeroPanel />

      <div className="relative flex flex-1 flex-col overflow-hidden bg-muted">
        <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 sm:px-10">
          <Image
            src="/form-bg.svg"
            alt=""
            aria-hidden
            width={705}
            height={522}
            className="pointer-events-none absolute top-1/2 left-1/2 z-0 w-176 max-w-none -translate-x-1/2 -translate-y-1/2 opacity-70"
          />

          <div className="relative z-10 w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col items-center gap-2 text-center">
              <Avatar size="lg" className="ring-2 ring-primary/20">
                <AvatarImage
                  src={institution.logoUrl ?? undefined}
                  alt={institution.name}
                />
                <AvatarFallback>
                  <Building2 className="size-6 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <h1 className="mt-2 text-xl font-semibold text-primary">
                {institution.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in to your staff/admin account
              </p>
            </div>

            <div className="mt-10">
              <LoginForm institutionSlug={institution.slug} />
            </div>
          </div>
        </div>

        <footer className="relative z-10 pb-6 text-center text-xs text-muted-foreground">
          Copyright &copy; {new Date().getFullYear()}. All Rights Reserved -
          Powered by Turon Technologies Limited.
        </footer>
      </div>
    </div>
  );
}
