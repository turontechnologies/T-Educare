import { PageHeader } from "@/components/shared/page-header";
import { FeeStructurePanel } from "@/components/features/finance/fee-structure-panel";

export default function FeeStructurePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={["Administrator", "Financials", "Fee Structure"]}
      />

      <div>
        <h1 className="text-xl font-semibold text-primary">Fee Structure</h1>
        <div className="mt-6">
          <FeeStructurePanel />
        </div>
      </div>
    </div>
  );
}
