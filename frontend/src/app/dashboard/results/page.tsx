import { ClipboardCheck } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function ResultsManagementPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Admin", "Results Management"]}
      title="Results Management"
      description="Upload, review, and publish student results."
      icon={ClipboardCheck}
    />
  );
}
