import { LifeBuoy } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function SupportPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Admin", "Support"]}
      title="Support"
      description="Support tickets and help-desk conversations will appear here."
      icon={LifeBuoy}
    />
  );
}
