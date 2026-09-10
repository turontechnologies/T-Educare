"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { DashboardSidebar } from "@/components/layouts/dashboard-sidebar";
import { useAuthStore } from "@/store/auth.store";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (hasHydrated && !token) {
      router.replace("/login");
    }
  }, [hasHydrated, token, router]);

  if (!token) {
    // Either still hydrating (AppSplash covers this) or unauthenticated and
    // about to be redirected — render nothing rather than flash the shell.
    return null;
  }

  return (
    <div className="flex min-h-screen bg-muted">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
