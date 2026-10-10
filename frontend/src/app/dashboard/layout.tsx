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
import { useCourseGrades } from "@/hooks/use-course-grades";
import { useCourses } from "@/hooks/use-courses";
import { useDepartments } from "@/hooks/use-departments";
import { useElectiveGroups } from "@/hooks/use-elective-groups";
import { useFaculties } from "@/hooks/use-faculties";
import { useGradingScale } from "@/hooks/use-grading-scale";
import { useInstitutions } from "@/hooks/use-institutions";
import { useLectureAssignments } from "@/hooks/use-lecture-assignments";
import { useLecturers } from "@/hooks/use-lecturers";
import { useMe } from "@/hooks/use-login";
import { useProgramLevels } from "@/hooks/use-program-levels";
import { usePrograms } from "@/hooks/use-programs";
import { useSchools } from "@/hooks/use-schools";
import { useStaffDesignations } from "@/hooks/use-staff-designations";
import { useStaffMembers } from "@/hooks/use-staff-members";
import { useStudentIdentitySettings } from "@/hooks/use-student-identity-settings";
import { useStudents } from "@/hooks/use-students";
import { useAcademicsStore } from "@/store/academics.store";
import { useAuthStore } from "@/store/auth.store";
import { useCourseGradesStore } from "@/store/course-grades.store";
import { useCoursesStore } from "@/store/courses.store";
import { useDepartmentsStore } from "@/store/departments.store";
import { useElectiveGroupsStore } from "@/store/elective-groups.store";
import { useFacultiesStore } from "@/store/faculties.store";
import { useInstitutionsStore } from "@/store/institutions.store";
import { useLectureAssignmentsStore } from "@/store/lecture-assignments.store";
import { useLecturersStore } from "@/store/lecturers.store";
import { useProgramLevelsStore } from "@/store/program-levels.store";
import { useProgramsStore } from "@/store/programs.store";
import { useSchoolsStore } from "@/store/schools.store";
import { useStaffMembersStore } from "@/store/staff-members.store";
import { useStaffStore } from "@/store/staff.store";
import { useStudentIdentitySettingsStore } from "@/store/student-identity-settings.store";
import { useStudentsStore } from "@/store/students.store";

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

  // Same "fetch-on-mount/focus, no polling" reasoning as Schools/Faculties/Departments above.
  const setPrograms = useProgramsStore((state) => state.setPrograms);
  const { data: programsData } = usePrograms(true, {
    enabled: hasHydrated && !!token && user?.role === "institution_admin",
  });
  useEffect(() => {
    if (programsData) setPrograms(programsData);
  }, [programsData, setPrograms]);

  // Same "fetch-on-mount/focus, no polling" reasoning as Schools/Faculties/Departments/Programs above.
  const setProgramLevels = useProgramLevelsStore(
    (state) => state.setProgramLevels,
  );
  const { data: programLevelsData } = useProgramLevels(true, {
    enabled: hasHydrated && !!token && user?.role === "institution_admin",
  });
  useEffect(() => {
    if (programLevelsData) setProgramLevels(programLevelsData);
  }, [programLevelsData, setProgramLevels]);

  // Same "fetch-on-mount/focus, no polling" reasoning as above. Two
  // genuinely separate real resources (API_CONTRACT.md §7.9) hydrated
  // into the one course-grades.store.ts, matching the pre-backend mock's
  // own combined shape.
  const setCourseGrades = useCourseGradesStore(
    (state) => state.setCourseGrades,
  );
  const { data: courseGradesData } = useCourseGrades(true, {
    enabled: hasHydrated && !!token && user?.role === "institution_admin",
  });
  useEffect(() => {
    if (courseGradesData) setCourseGrades(courseGradesData);
  }, [courseGradesData, setCourseGrades]);

  const setMaxGradePoint = useCourseGradesStore(
    (state) => state.setMaxGradePoint,
  );
  const { data: gradingScaleData } = useGradingScale({
    enabled: hasHydrated && !!token && user?.role === "institution_admin",
  });
  useEffect(() => {
    if (gradingScaleData) setMaxGradePoint(gradingScaleData.maxGradePoint);
  }, [gradingScaleData, setMaxGradePoint]);

  // Same "fetch-on-mount/focus, no polling" reasoning as above — this
  // closes out the Academics hierarchy's frontend wiring.
  const setCourses = useCoursesStore((state) => state.setCourses);
  const { data: coursesData } = useCourses(true, {
    enabled: hasHydrated && !!token && user?.role === "institution_admin",
  });
  useEffect(() => {
    if (coursesData) setCourses(coursesData);
  }, [coursesData, setCourses]);

  const setStudents = useStudentsStore((state) => state.setStudents);
  const { data: studentsData } = useStudents(
    { includeArchived: true },
    { enabled: hasHydrated && !!token && user?.role === "institution_admin" },
  );
  useEffect(() => {
    if (studentsData) setStudents(studentsData);
  }, [studentsData, setStudents]);

  const setStaffDesignations = useStaffStore((state) => state.setDesignations);
  const { data: staffDesignationsData } = useStaffDesignations(true, {
    enabled: hasHydrated && !!token && user?.role === "institution_admin",
  });
  useEffect(() => {
    if (staffDesignationsData) setStaffDesignations(staffDesignationsData);
  }, [staffDesignationsData, setStaffDesignations]);

  const setStaffMembers = useStaffMembersStore(
    (state) => state.setStaffMembers,
  );
  const { data: staffMembersData } = useStaffMembers(
    { includeArchived: true },
    { enabled: hasHydrated && !!token && user?.role === "institution_admin" },
  );
  useEffect(() => {
    if (staffMembersData) setStaffMembers(staffMembersData);
  }, [staffMembersData, setStaffMembers]);

  const setLecturers = useLecturersStore((state) => state.setLecturers);
  const { data: lecturersData } = useLecturers({
    enabled: hasHydrated && !!token && user?.role === "institution_admin",
  });
  useEffect(() => {
    if (lecturersData) setLecturers(lecturersData);
  }, [lecturersData, setLecturers]);

  const setLectureAssignments = useLectureAssignmentsStore(
    (state) => state.setAssignments,
  );
  const { data: lectureAssignmentsData } = useLectureAssignments(
    {},
    { enabled: hasHydrated && !!token && user?.role === "institution_admin" },
  );
  useEffect(() => {
    if (lectureAssignmentsData) setLectureAssignments(lectureAssignmentsData);
  }, [lectureAssignmentsData, setLectureAssignments]);

  const setStudentIdentitySettings = useStudentIdentitySettingsStore(
    (state) => state.setSettings,
  );
  const { data: studentIdentitySettingsData } = useStudentIdentitySettings({
    enabled: hasHydrated && !!token && user?.role === "institution_admin",
  });
  useEffect(() => {
    if (studentIdentitySettingsData) {
      setStudentIdentitySettings(studentIdentitySettingsData);
    }
  }, [studentIdentitySettingsData, setStudentIdentitySettings]);

  const setElectiveGroups = useElectiveGroupsStore(
    (state) => state.setElectiveGroups,
  );
  const { data: electiveGroupsData } = useElectiveGroups(true, {
    enabled: hasHydrated && !!token && user?.role === "institution_admin",
  });
  useEffect(() => {
    if (electiveGroupsData) setElectiveGroups(electiveGroupsData);
  }, [electiveGroupsData, setElectiveGroups]);

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
