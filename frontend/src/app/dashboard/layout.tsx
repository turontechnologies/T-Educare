"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layouts/app-shell";
import {
  filterNavByAccess,
  filterNavByModules,
  INSTITUTION_NAV,
} from "@/config/nav";
import { useAcademicSemesters } from "@/hooks/use-academic-semesters";
import { useAcademicSessions } from "@/hooks/use-academic-sessions";
import { useDepartments } from "@/hooks/use-departments";
import { useFaculties } from "@/hooks/use-faculties";
import { useInstitutions } from "@/hooks/use-institutions";
import { useMe } from "@/hooks/use-login";
import { useSchools } from "@/hooks/use-schools";
import { useAcademicsStore } from "@/store/academics.store";
import { useAuthStore } from "@/store/auth.store";
import { useDepartmentsStore } from "@/store/departments.store";
import { useFacultiesStore } from "@/store/faculties.store";
import { useInstitutionsStore } from "@/store/institutions.store";
import { useSchoolsStore } from "@/store/schools.store";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const institutions = useInstitutionsStore((state) => state.institutions);
  const setInstitutions = useInstitutionsStore(
    (state) => state.setInstitutions,
  );

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.replace("/login");
    } else if (user?.role === "super_admin") {
      router.replace("/super-admin");
    }
  }, [hasHydrated, token, user, router]);

  // Refresh this user's own session data (name, avatar, institution
  // assignment) from the live backend — see use-login.ts's useMe for why.
  const { data: me } = useMe(hasHydrated && !!token);
  useEffect(() => {
    if (me) setUser(me);
  }, [me, setUser]);

  // The institution_admin's own nav is capped by their institution's real
  // moduleKeys (filterNavByModules below) — hydrate the shared store from
  // the real backend the same way super-admin/layout.tsx does. Polled every
  // few seconds (not just on mount/refocus) so a super admin assigning/
  // changing this institution's modules reaches an already-open session
  // live, without needing a fresh login — there's no push/WebSocket layer
  // in this backend, and a low-frequency admin config change like this one
  // doesn't warrant building one; short polling is the right-sized fix.
  const { data: institutionsData } = useInstitutions(
    { includeArchived: true, perPage: 1000 },
    {
      enabled: hasHydrated && !!token && user?.role === "institution_admin",
      refetchInterval: 4_000,
    },
  );
  useEffect(() => {
    if (institutionsData) setInstitutions(institutionsData.data);
  }, [institutionsData, setInstitutions]);

  // Academic Sessions/Semesters (API_CONTRACT.md §7/§7.1) — real backend now.
  // No polling needed here: unlike Institutions' moduleKeys, only this same
  // institution_admin session itself ever changes these, so a normal
  // fetch-on-mount/focus is enough.
  const setSessions = useAcademicsStore((state) => state.setSessions);
  const setSemesters = useAcademicsStore((state) => state.setSemesters);
  const { data: sessionsData } = useAcademicSessions(true, {
    enabled: hasHydrated && !!token && user?.role === "institution_admin",
  });
  const { data: semestersData } = useAcademicSemesters(true, {
    enabled: hasHydrated && !!token && user?.role === "institution_admin",
  });
  useEffect(() => {
    if (sessionsData) setSessions(sessionsData);
  }, [sessionsData, setSessions]);
  useEffect(() => {
    if (semestersData) setSemesters(semestersData);
  }, [semestersData, setSemesters]);

  // Same "fetch-on-mount/focus, no polling" reasoning as Academic Sessions
  // above — only this same institution_admin session changes Schools.
  const setSchools = useSchoolsStore((state) => state.setSchools);
  const { data: schoolsData } = useSchools(true, {
    enabled: hasHydrated && !!token && user?.role === "institution_admin",
  });
  useEffect(() => {
    if (schoolsData) setSchools(schoolsData);
  }, [schoolsData, setSchools]);

  // Same "fetch-on-mount/focus, no polling" reasoning as Schools above.
  const setFaculties = useFacultiesStore((state) => state.setFaculties);
  const { data: facultiesData } = useFaculties(true, {
    enabled: hasHydrated && !!token && user?.role === "institution_admin",
  });
  useEffect(() => {
    if (facultiesData) setFaculties(facultiesData);
  }, [facultiesData, setFaculties]);

  // Same "fetch-on-mount/focus, no polling" reasoning as Schools/Faculties above.
  const setDepartments = useDepartmentsStore((state) => state.setDepartments);
  const { data: departmentsData } = useDepartments(true, {
    enabled: hasHydrated && !!token && user?.role === "institution_admin",
  });
  useEffect(() => {
    if (departmentsData) setDepartments(departmentsData);
  }, [departmentsData, setDepartments]);

  const liveInstitution = institutions.find(
    (i) => i.id === user?.institutionId,
  );

  const menu = useMemo(() => {
    const moduleScopedNav = filterNavByModules(
      INSTITUTION_NAV,
      liveInstitution?.moduleKeys ?? [],
    );

    // The backend resolves this live from the real Role behind roleId (see
    // AuthDirectory) — never a client-side lookup. Absent means unrestricted.
    return filterNavByAccess(moduleScopedNav, user?.menuKeys ?? null);
  }, [liveInstitution, user?.menuKeys]);

  if (!token || user?.role !== "institution_admin") {
    // Either still hydrating (AppSplash covers this) or unauthenticated/wrong
    // role and about to be redirected — render nothing rather than flash the
    // wrong shell.

    return null;
  }

  // The sidebar's brand band shows this institution's own name/logo instead
  // of the platform's — live store wins once hydrated, falling back to the
  // login snapshot (same pattern as app-header.tsx) so it's never blank
  // while that fetch is in flight, and finally "TEduCare" if truly nothing
  // has resolved yet.
  const brand = liveInstitution?.name ?? user?.institutionName ?? "TEduCare";
  const logoSrc = liveInstitution?.logoUrl ?? user?.institutionLogoUrl;

  return (
    <AppShell menu={menu} brand={brand} logoSrc={logoSrc}>
      {children}
    </AppShell>
  );
}
