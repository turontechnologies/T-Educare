import { LayoutGrid } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function ProgramManagementPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Admin", "Program Management"]}
      title="Program Management"
      description="Manage degree programs offered by each department."
      icon={LayoutGrid}
    />
  );
}
