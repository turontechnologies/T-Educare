import { Bell } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function NotificationsPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Administrator", "Notifications"]}
      title="Notifications"
      description="Platform-wide notifications and alerts will appear here."
      icon={Bell}
    />
  );
}
