"use client";

import { Building2, EyeOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { ChangePasswordCard } from "@/components/features/profile/change-password-card";
import { PersonalInfoCard } from "@/components/features/profile/personal-info-card";
import { ProfileHeroCard } from "@/components/features/profile/profile-hero-card";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/use-profile";
import { profileService } from "@/services/profile.service";
import { useAuthStore } from "@/store/auth.store";

export default function InstitutionAdminProfilePage() {
  const authUser = useAuthStore((state) => state.user);
  const { data, isLoading, isError } = useProfile();

  const profile = data?.profile ?? {
    firstName: authUser?.firstName ?? "",
    lastName: authUser?.lastName ?? "",
    email: authUser?.email ?? "",
    phone: authUser?.phone ?? "",
    avatarUrl: authUser?.avatarUrl ?? "",
    institutionName: authUser?.institutionName ?? "",
    role: authUser?.role ?? "institution_admin",
  };

  const roleLabel =
    profile.role === "super_admin" ? "Super Admin" : "Institution Admin";

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
        roleLabel={roleLabel}
        subtitle={profile.institutionName ?? ""}
        onAvatarChange={() => undefined}
      />

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardHeader>
          <CardTitle className="text-primary">My Institution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar className="size-16 shrink-0 rounded-md" size="lg">
              <AvatarImage
                src={profile.avatarUrl ?? ""}
                alt={profile.institutionName || "Institution"}
                className="rounded-md object-cover"
              />
              <AvatarFallback className="rounded-md bg-muted">
                <Building2 className="size-6 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>

            <div className="grid flex-1 grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Institution</p>
                <p className="font-medium text-foreground">
                  {profile.institutionName || "Not assigned"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Access</p>
                <p className="font-medium text-foreground">Full access</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="font-medium text-foreground">{roleLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className={cn("font-medium capitalize", "text-emerald-600")}>
                  Active
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Session</p>
                <p className="font-medium text-foreground">Live</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Token</p>
                <p className="inline-flex items-center gap-1.5 font-mono text-foreground">
                  <EyeOff className="size-3.5 shrink-0 text-muted-foreground" />
                  Encrypted in session
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
