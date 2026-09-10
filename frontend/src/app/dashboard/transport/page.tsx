import { Bus } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function TransportManagementPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Admin", "Transport Management"]}
      title="Transport Management"
      description="Manage transport routes and vehicle assignments."
      icon={Bus}
    />
  );
}
