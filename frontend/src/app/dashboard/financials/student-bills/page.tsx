import { FileText } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function StudentBillsPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Administrator", "Financials", "Student Bills"]}
      title="Student Bills"
      description="Per-student billing, ledgers, and payment recording — coming next."
      icon={FileText}
    />
  );
}
