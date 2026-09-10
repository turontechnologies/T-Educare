import { ClipboardCheck } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function CoursesGradesPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Admin", "Courses Grades"]}
      title="Courses Grades"
      description="Configure the grading scale used across courses."
      icon={ClipboardCheck}
    />
  );
}
