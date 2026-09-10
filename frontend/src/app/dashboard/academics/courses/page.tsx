import { School } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function CoursesManagementPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Admin", "Courses Management"]}
      title="Courses Management"
      description="Manage the course catalogue for every program."
      icon={School}
    />
  );
}
