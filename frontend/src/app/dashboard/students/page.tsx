import { Users } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function StudentManagementPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Admin", "Student Management"]}
      title="Student Management"
      description="Search, filter, and manage every enrolled student record."
      icon={Users}
    />
  );
}
