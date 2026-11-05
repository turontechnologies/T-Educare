"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
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
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-3 py-20 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">Loading your institution&apos;s sign-in page…</p>
      </div>
    );
  }

  if (isError || !institution) {
    return (
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-3 py-20 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <h1 className="text-lg font-semibold text-foreground">
          We couldn&apos;t find that institution
        </h1>
        <p className="text-sm text-muted-foreground">
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
    <>
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
          {institution.logoUrl ? (
            <Image
              src={institution.logoUrl}
              alt={institution.name}
              width={64}
              height={64}
              className="size-16 rounded-full object-cover ring-2 ring-primary/20"
            />
          ) : null}
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
    </>
  );
}
