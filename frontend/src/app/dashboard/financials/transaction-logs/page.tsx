import { PageHeader } from "@/components/shared/page-header";
import { TransactionLogsPanel } from "@/components/features/finance/transaction-logs-panel";

export default function TransactionLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={["Administrator", "Financials", "Transaction Logs"]}
      />

      <div>
        <h1 className="text-xl font-semibold text-primary">Transaction Logs</h1>
        <div className="mt-6">
          <TransactionLogsPanel />
        </div>
      </div>
    </div>
  );
}
