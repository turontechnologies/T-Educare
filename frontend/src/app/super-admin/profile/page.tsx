"use client";

import { useMemo } from "react";
import { Boxes, Landmark, ShieldCheck, UserCog } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ChangePasswordCard } from "@/components/features/profile/change-password-card";
import { PersonalInfoCard } from "@/components/features/profile/personal-info-card";
import { ProfileHeroCard } from "@/components/features/profile/profile-hero-card";
import { useAuthStore } from "@/store/auth.store";
import { useInstitutionsStore } from "@/store/institutions.store";
import { useSuperAdminProfileStore } from "@/store/super-admin-profile.store";
import { useUserManagersStore } from "@/store/user-managers.store";

export default function SuperAdminProfilePage() {
  const { profile, updateProfile, changePassword } =
    useSuperAdminProfileStore();
  const setUser = useAuthStore((state) => state.setUser);
  const authUser = useAuthStore((state) => state.user);
  const institutions = useInstitutionsStore((state) => state.institutions);
  const userManagers = useUserManagersStore((state) => state.userManagers);

  const stats = useMemo(() => {
    const active = institutions.filter((i) => !i.archivedAt);
    return {
      totalInstitutions: active.length,
      licensedInstitutions: active.filter((i) => i.licenseKey).length,
      linkedToModules: active.filter((i) => i.moduleKeys.length > 0).length,
      userManagerAccounts: userManagers.filter((u) => !u.archivedAt).length,
    };
  }, [institutions, userManagers]);

  const syncSession = (patch: Partial<typeof authUser>) => {
    if (!authUser) return;
    setUser({ ...authUser, ...patch });
  };

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Profile"]} />

      <ProfileHeroCard
        firstName={profile.firstName}
        lastName={profile.lastName}
        email={profile.email}
        phone={profile.phone}
        avatarUrl={profile.avatarUrl}
        roleLabel="Super Admin"
        subtitle="Platform owner"
        onAvatarChange={(url) => {
          updateProfile({ avatarUrl: url });
          syncSession({ avatarUrl: url });
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Institutions"
          value={String(stats.totalInstitutions)}
          icon={Landmark}
          iconClassName="bg-secondary/10 text-secondary"
        />
        <StatCard
          label="Licensed"
          value={String(stats.licensedInstitutions)}
          icon={ShieldCheck}
          iconClassName="bg-tertiary/15 text-tertiary-foreground"
          className="delay-75"
        />
        <StatCard
          label="Linked to Modules"
          value={String(stats.linkedToModules)}
          icon={Boxes}
          iconClassName="bg-orange-100 text-orange-500"
          className="delay-150"
        />
        <StatCard
          label="User Manager Accounts"
          value={String(stats.userManagerAccounts)}
          icon={UserCog}
          iconClassName="bg-emerald-100 text-emerald-600"
          className="delay-200"
        />
      </div>

      <PersonalInfoCard
        defaultValues={{
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phone,
        }}
        onSave={(values) => {
          updateProfile(values);
          syncSession(values);
        }}
      />

      <ChangePasswordCard
        currentPassword={profile.password}
        onChangePassword={changePassword}
      />
    </div>
  );
}
