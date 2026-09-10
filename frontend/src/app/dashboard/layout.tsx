"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layouts/app-shell";
import {
  filterNavByAccess,
  filterNavByModules,
  INSTITUTION_NAV,
} from "@/config/nav";
import { useAuthStore } from "@/store/auth.store";
import { useInstitutionsStore } from "@/store/institutions.store";
import { useRbacStore } from "@/store/rbac.store";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const roles = useRbacStore((state) => state.roles);
  const institutions = useInstitutionsStore((state) => state.institutions);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.replace("/login");
    } else if (user?.role === "super_admin") {
      router.replace("/super-admin");
    }
  }, [hasHydrated, token, user, router]);

  const menu = useMemo(() => {
    const institution = institutions.find((i) => i.id === user?.institutionId);
    const moduleScopedNav = filterNavByModules(
      INSTITUTION_NAV,
      institution?.moduleKeys ?? [],
    );

    const role = roles.find((r) => r.id === user?.roleId);
    const allowedKeys =
      !user?.roleId || role?.isSystem ? null : (role?.menuKeys ?? []);
    return filterNavByAccess(moduleScopedNav, allowedKeys);
  }, [institutions, roles, user?.institutionId, user?.roleId]);

  if (!token || user?.role !== "institution_admin") {
    // Either still hydrating (AppSplash covers this) or unauthenticated/wrong
    // role and about to be redirected — render nothing rather than flash the
    // wrong shell.

    return null;
  }

  return (
    <AppShell menu={menu} brand="TEduCare" brandSuffix="TECH">
      {children}
    </AppShell>
  );
}
