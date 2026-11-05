import { History } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function TransactionLogsPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Administrator", "Financials", "Transaction Logs"]}
      title="Transaction Logs"
      description="A read-only audit log of every payment and payroll event — coming next."
      icon={History}
    />
  );
}
