"use client";

import { useEffect, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStudentAuthStore } from "@/store/student-auth.store";
import { DashboardHeader } from "@/components/features/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/features/dashboard/dashboard-sidebar";

export default function StudentPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const hasHydrated = useStudentAuthStore((state) => state.hasHydrated);
  const token = useStudentAuthStore((state) => state.token);
  const student = useStudentAuthStore((state) => state.student);

  useEffect(() => {
    if (!hasHydrated) return;
    // Also guards against a stale session from a DIFFERENT institution's
    // slug being used here — never render one tenant's cached dashboard
    // under another tenant's URL, even for a split second.
    if (!token || !student || student.institutionSlug !== params.slug) {
      router.replace(`/${params.slug}/login`);
    }
  }, [hasHydrated, token, student, params.slug, router]);

  if (
    !hasHydrated ||
    !token ||
    !student ||
    student.institutionSlug !== params.slug
  ) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen w-full bg-muted"
      style={
        student.institutionBrandColor
          ? ({
              "--primary": student.institutionBrandColor,
            } as React.CSSProperties)
          : undefined
      }
    >
      <DashboardSidebar student={student} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader student={student} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
