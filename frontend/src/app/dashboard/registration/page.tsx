import { UserPlus } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function RegistrationPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Admin", "Registration"]}
      title="Registration"
      description="Student and applicant registration workflows will live here."
      icon={UserPlus}
    />
  );
}
