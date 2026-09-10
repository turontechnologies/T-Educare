import { Boxes } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function DepartmentManagementPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Admin", "Department Management"]}
      title="Department Management"
      description="Manage departments within each faculty."
      icon={Boxes}
    />
  );
}
