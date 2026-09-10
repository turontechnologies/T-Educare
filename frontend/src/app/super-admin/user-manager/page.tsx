import { UserCog } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function UserManagerPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Administrator", "User Manager"]}
      title="User Manager"
      description="Manage platform-level admin accounts across institutions."
      icon={UserCog}
    />
  );
}
