import { PieChart } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function FinancialsOverviewPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Administrator", "Financials", "Overview"]}
      title="Finance Overview"
      description="A summary of revenue, outstanding balances, and payroll will appear here once Fee Structure, Student Bills, and Staff Payroll are in place."
      icon={PieChart}
    />
  );
}
