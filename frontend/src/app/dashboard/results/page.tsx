"use client";

import { PageHeader } from "@/components/shared/page-header";
import { AdminResultsView } from "@/components/features/results/admin-results-view";
import { TeacherResultsView } from "@/components/features/results/teacher-results-view";
import { useAuthStore } from "@/store/auth.store";

export default function ResultsManagementPage() {
  const user = useAuthStore((state) => state.user);
  const isLecturerSelfService = !!user?.lecturerId;

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Results Management"]} />

      <div>
        <h1 className="text-xl font-semibold text-primary">
          Results Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLecturerSelfService
            ? "Record and submit results for your own courses, or your whole department's if you're its HOD."
            : "Set the marking guide, review course completion, and publish results."}
        </p>

        <div className="mt-6">
          {isLecturerSelfService ? (
            <TeacherResultsView />
          ) : (
            <AdminResultsView />
          )}
        </div>
      </div>
    </div>
  );
}
