"use client";

import { Boxes, Landmark, ShieldCheck, UserCog } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ChangePasswordCard } from "@/components/features/profile/change-password-card";
import { PersonalInfoCard } from "@/components/features/profile/personal-info-card";
import { ProfileHeroCard } from "@/components/features/profile/profile-hero-card";
import { useProfile } from "@/hooks/use-profile";
import { profileService } from "@/services/profile.service";
import { useAuthStore } from "@/store/auth.store";

export default function SuperAdminProfilePage() {
  const authUser = useAuthStore((state) => state.user);
  const { data, isLoading, isError } = useProfile();

  const profile = data?.profile ?? {
    firstName: authUser?.firstName ?? "",
    lastName: authUser?.lastName ?? "",
    email: authUser?.email ?? "",
    phone: authUser?.phone ?? "",
    avatarUrl: authUser?.avatarUrl ?? "",
  };

  const summary = data?.summary ?? {};

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumb={["Administrator", "Profile"]} />
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          Loading profile...
        </div>
      </div>
    );
  }

  if (isError && !data) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumb={["Administrator", "Profile"]} />
        <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6 text-sm text-destructive">
          Unable to load profile data from the backend.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Profile"]} />

      <ProfileHeroCard
        firstName={profile.firstName}
        lastName={profile.lastName}
        email={profile.email}
        phone={profile.phone ?? ""}
        avatarUrl={profile.avatarUrl ?? ""}
        roleLabel="Super Admin"
        subtitle="Platform owner"
        onAvatarChange={() => undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Institutions"
          value={String(summary.institutionsCount ?? 0)}
          icon={Landmark}
          iconClassName="bg-secondary/10 text-secondary"
        />
        <StatCard
          label="Licensed"
          value={String(summary.licensed ?? 0)}
          icon={ShieldCheck}
          iconClassName="bg-tertiary/15 text-tertiary-foreground"
          className="delay-75"
        />
        <StatCard
          label="Linked to Modules"
          value={String(summary.linkedModules ?? 0)}
          icon={Boxes}
          iconClassName="bg-orange-100 text-orange-500"
          className="delay-150"
        />
        <StatCard
          label="User Manager Accounts"
          value={String(summary.userManagerAccounts ?? 0)}
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
          phone: profile.phone ?? "",
        }}
        onSave={() => undefined}
      />

      <ChangePasswordCard
        currentPassword=""
        onChangePassword={async (newPassword) => {
          await profileService.updatePassword({
            currentPassword: "",
            newPassword,
          });
        }}
      />
    </div>
  );
}
