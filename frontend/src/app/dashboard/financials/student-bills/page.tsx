import { PageHeader } from "@/components/shared/page-header";
import { StudentBillsPanel } from "@/components/features/finance/student-bills-panel";

export default function StudentBillsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={["Administrator", "Financials", "Student Bills"]}
      />

      <div>
        <h1 className="text-xl font-semibold text-primary">Student Bills</h1>
        <div className="mt-6">
          <StudentBillsPanel />
        </div>
      </div>
    </div>
  );
}
