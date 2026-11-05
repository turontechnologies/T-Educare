"use client";

import { useStudentAuthStore } from "@/store/student-auth.store";
import { AcademicSummaryCard } from "@/components/features/dashboard/academic-summary-card";
import { HostelStatusCard } from "@/components/features/dashboard/hostel-status-card";
import { BillsCard } from "@/components/features/dashboard/bills-card";

export default function StudentDashboardPage() {
  const student = useStudentAuthStore((state) => state.student);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Welcome back, {student?.firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s going on with your studies.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AcademicSummaryCard />
        <HostelStatusCard />
      </div>

      <BillsCard />
    </div>
  );
}
