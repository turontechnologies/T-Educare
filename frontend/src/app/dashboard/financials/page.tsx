import { PageHeader } from "@/components/shared/page-header";
import { FinanceOverviewPanel } from "@/components/features/finance/finance-overview-panel";

export default function FinancialsOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Financials", "Overview"]} />

      <div>
        <h1 className="text-xl font-semibold text-primary">Finance Overview</h1>
        <div className="mt-6">
          <FinanceOverviewPanel />
        </div>
      </div>
    </div>
  );
}
