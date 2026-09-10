import { Building2 } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function HostelManagementPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Admin", "Hostel Management"]}
      title="Hostel Management"
      description="Manage hostel allocations and room availability."
      icon={Building2}
    />
  );
}
