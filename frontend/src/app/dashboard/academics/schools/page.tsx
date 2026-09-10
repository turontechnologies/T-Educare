import { School } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function SchoolManagementPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Admin", "School Management"]}
      title="School Management"
      description="Manage the schools/colleges that sit above your faculties."
      icon={School}
    />
  );
}
