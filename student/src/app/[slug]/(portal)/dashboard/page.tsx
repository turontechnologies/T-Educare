"use client";

import { BookOpen, GraduationCap, Home } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/features/dashboard/stat-card";
import { ResultsPerSemesterCard } from "@/components/features/dashboard/results-per-semester-card";
import {
  useAcademicSummary,
  useHostelStatus,
} from "@/hooks/use-student-portal";
import { useStudentAuthStore } from "@/store/student-auth.store";

function todayLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default function StudentDashboardPage() {
  const student = useStudentAuthStore((state) => state.student);
  const { data: summary, isLoading: summaryLoading } = useAcademicSummary(true);
  const { data: hostel, isLoading: hostelLoading } = useHostelStatus(true);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>
          Student <span className="mx-1">›</span> Dashboard
        </p>
        <p>Today&apos;s Date: {todayLabel()}</p>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-primary">
          Welcome back, {student?.firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {summaryLoading || !summary
            ? "Loading your academic summary…"
            : `${summary.departmentName} · ${summary.levelCode} Level · ${student?.matricNo} · ${summary.currentSemesterName ?? "No active semester"} ${summary.sessionLabel}`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaryLoading || !summary ? (
          <>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        ) : (
          <>
            <StatCard
              label="Cumulative GPA (CGPA)"
              value={summary.cgpa != null ? summary.cgpa.toFixed(2) : "—"}
              subtitle={summary.cgpaClassification ?? "No results yet"}
              icon={GraduationCap}
              iconClassName="bg-[#8B5CF6]/10 text-[#8B5CF6]"
            />
            <StatCard
              label="Registered courses"
              value={`${summary.registeredCourses.length} course${summary.registeredCourses.length === 1 ? "" : "s"}`}
              subtitle={`${summary.registeredUnits} units this term`}
              icon={BookOpen}
              iconClassName="bg-tertiary/10 text-tertiary-foreground"
            />
          </>
        )}

        {hostelLoading || !hostel ? (
          <Skeleton className="h-28 w-full" />
        ) : (
          <StatCard
            label="Hostel"
            value={hostel.hostelName ? hostel.hostelName : "Not registered"}
            subtitle={
              hostel.hostelName
                ? `Room ${hostel.roomNumber}`
                : "Apply from Hostel Management"
            }
            icon={Home}
            iconClassName="bg-orange-500/10 text-orange-600"
          />
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-primary">
            Results per semester
          </h2>
        </div>

        {summaryLoading || !summary ? (
          <Skeleton className="h-40 w-full" />
        ) : summary.resultsBySemester.length === 0 ? (
          <p className="rounded-md bg-card px-4 py-6 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
            No results published yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summary.resultsBySemester.map((result) => (
              <ResultsPerSemesterCard key={result.semesterId} result={result} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
