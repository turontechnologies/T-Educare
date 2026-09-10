import { Users } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function AllStaffPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Admin", "All Staff"]}
      title="All Staff"
      description="A directory of every staff member across departments."
      icon={Users}
    />
  );
}
