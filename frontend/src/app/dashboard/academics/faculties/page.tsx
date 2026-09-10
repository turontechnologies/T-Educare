import { Building2 } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function FacultyManagementPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Admin", "Faculty Management"]}
      title="Faculty Management"
      description="Manage faculties within each school."
      icon={Building2}
    />
  );
}
