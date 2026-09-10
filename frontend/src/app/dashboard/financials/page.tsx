import { Wallet } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function FinancialsPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Admin", "Financials"]}
      title="Financials"
      description="Track fees, payments, and outstanding balances."
      icon={Wallet}
    />
  );
}
