import { Megaphone } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function AnnouncementPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Admin", "Announcement"]}
      title="Announcement"
      description="Publish announcements visible across the institution."
      icon={Megaphone}
    />
  );
}
