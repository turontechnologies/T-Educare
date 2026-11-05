import { Banknote } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function StaffPayrollPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Administrator", "Financials", "Staff Payroll"]}
      title="Staff Payroll"
      description="Monthly payroll runs and payslips — coming next."
      icon={Banknote}
    />
  );
}
