import { Boxes } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function ModulesPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Administrator", "Modules"]}
      title="Modules"
      description="Enable or disable modules available to each institution."
      icon={Boxes}
    />
  );
}
