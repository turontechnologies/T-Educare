import { PageHeader } from "@/components/shared/page-header";
import { StaffPayrollPanel } from "@/components/features/finance/staff-payroll-panel";

export default function StaffPayrollPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={["Administrator", "Financials", "Staff Payroll"]}
      />

      <div>
        <h1 className="text-xl font-semibold text-primary">Staff Payroll</h1>
        <div className="mt-6">
          <StaffPayrollPanel />
        </div>
      </div>
    </div>
  );
}
