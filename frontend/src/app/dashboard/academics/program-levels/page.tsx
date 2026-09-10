import { BadgeCheck } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function ProgramLevelsPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Admin", "Program Levels"]}
      title="Program Levels"
      description="Manage program levels (ND, HND, BSc, MSc, and so on)."
      icon={BadgeCheck}
    />
  );
}
