import { School } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function LectureManagementPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Admin", "Lecture Management"]}
      title="Lecture Management"
      description="Schedule lectures and assign them to lecturers."
      icon={School}
    />
  );
}
