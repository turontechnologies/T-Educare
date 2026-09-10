import { Inbox } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function RequestsPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Admin", "Requests"]}
      title="Requests"
      description="Review and action requests submitted by students and staff."
      icon={Inbox}
    />
  );
}
