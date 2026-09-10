"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layouts/app-shell";
import { SUPER_ADMIN_NAV } from "@/config/nav";
import { useAuthStore } from "@/store/auth.store";

export default function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.replace("/login");
    } else if (user?.role !== "super_admin") {
      router.replace("/dashboard");
    }
  }, [hasHydrated, token, user, router]);

  if (!token || user?.role !== "super_admin") {
    return null;
  }

  return (
    <AppShell menu={SUPER_ADMIN_NAV} brand="TEduCare">
      {children}
    </AppShell>
  );
}
