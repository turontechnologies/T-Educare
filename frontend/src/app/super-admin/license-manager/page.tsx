import { ShieldCheck } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function LicenseManagerPage() {
  return (
    <ModulePlaceholder
      breadcrumb={["Administrator", "License Manager"]}
      title="License Manager"
      description="Manage institution licenses, seats, and renewal dates."
      icon={ShieldCheck}
    />
  );
}
