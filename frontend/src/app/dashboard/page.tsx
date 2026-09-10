import type { Metadata } from "next";
import {
  Banknote,
  Calendar,
  Clock,
  GraduationCap,
  Users,
  UsersRound,
} from "lucide-react";
import { EnrollmentChart } from "@/components/features/dashboard/enrollment-chart";
import { RecentStudentsCard } from "@/components/features/dashboard/recent-students-card";
import { StatCard } from "@/components/features/dashboard/stat-card";

export const metadata: Metadata = {
  title: "Dashboard",
};

const todayLabel = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
}).format(new Date());

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Admin</span>
          <span className="mx-1.5">&gt;</span>
          Dashboard
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" />
            Last Login: {todayLabel}
          </span>
          <span className="h-3.5 w-px bg-border" />
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            Today&apos;s Date: {todayLabel}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total number of registered students"
          value="48043"
          icon={GraduationCap}
          iconClassName="bg-secondary/10 text-secondary"
        />
        <StatCard
          label="Total number of applicants"
          value="158429"
          icon={UsersRound}
          iconClassName="bg-tertiary/15 text-tertiary-foreground"
        />
        <StatCard
          label="Total number of Lecturers"
          value="10238"
          icon={Users}
          iconClassName="bg-muted text-muted-foreground"
        />
        <StatCard
          label="Total Accumulative Profits"
          value="1,248,043.00"
          icon={Banknote}
          iconClassName="bg-orange-100 text-orange-500"
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
