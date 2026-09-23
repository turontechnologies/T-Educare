"use client";

import { Banknote, GraduationCap, Users, UsersRound } from "lucide-react";
import { EnrollmentChart } from "@/components/features/dashboard/enrollment-chart";
import { RecentStudentsCard } from "@/components/features/dashboard/recent-students-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useInstitutionDashboardStats } from "@/hooks/use-dashboard";

export default function DashboardPage() {
  const { data: stats } = useInstitutionDashboardStats();
  const safeStats = stats ?? {
    registeredStudents: 0,
    applicants: 0,
    lecturers: 0,
    accumulatedProfit: 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Admin", "Dashboard"]} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total number of registered students"
          value={String(safeStats.registeredStudents)}
          icon={GraduationCap}
          iconClassName="bg-secondary/10 text-secondary"
        />
        <StatCard
          label="Total number of applicants"
          value={String(safeStats.applicants)}
          icon={UsersRound}
          iconClassName="bg-tertiary/15 text-tertiary-foreground"
          className="delay-75"
        />
        <StatCard
          label="Total number of Lecturers"
          value={String(safeStats.lecturers)}
          icon={Users}
          iconClassName="bg-muted text-muted-foreground"
          className="delay-150"
        />
        <StatCard
          label="Total Accumulative Profits"
          value={safeStats.accumulatedProfit.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
          icon={Banknote}
          iconClassName="bg-orange-100 text-orange-500"
          className="delay-200"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <EnrollmentChart />
        <RecentStudentsCard />
      </div>

      <footer className="pt-2 text-center text-xs text-muted-foreground">
        Copyright &copy; {new Date().getFullYear()}. All Rights Reserved -
        Powered by Turon Technologies Limited.
      </footer>
    </div>
  );
}
