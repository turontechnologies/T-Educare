"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layouts/app-shell";
import { SUPER_ADMIN_NAV } from "@/config/nav";
import { useInstitutions } from "@/hooks/use-institutions";
import { useMe } from "@/hooks/use-login";
import { useAuthStore } from "@/store/auth.store";
import { useInstitutionsStore } from "@/store/institutions.store";

export default function SuperAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setInstitutions = useInstitutionsStore(
    (state) => state.setInstitutions,
  );

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.replace("/login");
    } else if (user?.role !== "super_admin") {
      router.replace("/dashboard");
    }
  }, [hasHydrated, token, user, router]);

  // Refresh this user's own session data from the live backend — see
  // use-login.ts's useMe for why (also keeps a super admin's own profile
  // edits reflected without a full re-login).
  const { data: me } = useMe(hasHydrated && !!token);
  useEffect(() => {
    if (me) setUser(me);
  }, [me, setUser]);

  // Every super-admin page (Institutions, Modules, License Manager, User
  // Manager, Role dialog) reads the shared institutions store — hydrate it
  // once here from the real backend rather than each page fetching its own.
  const { data: institutionsData } = useInstitutions(
    { includeArchived: true, perPage: 1000 },
    { enabled: hasHydrated && !!token && user?.role === "super_admin" },
  );
  useEffect(() => {
    if (institutionsData) setInstitutions(institutionsData.data);
  }, [institutionsData, setInstitutions]);

  if (!token || user?.role !== "super_admin") {
    return null;
  }

  return (
    <AppShell menu={SUPER_ADMIN_NAV} brand="TEduCare">
      {children}
    </AppShell>
  );
}
