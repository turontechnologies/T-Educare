"use client";

import { Building2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { toast } from "sonner";
import { ChangePasswordCard } from "@/components/features/profile/change-password-card";
import { PersonalInfoCard } from "@/components/features/profile/personal-info-card";
import { ProfileHeroCard } from "@/components/features/profile/profile-hero-card";
import { cn } from "@/lib/utils";
import {
  useChangePassword,
  useProfile,
  useUpdateProfile,
} from "@/hooks/use-profile";
import { useAuthStore } from "@/store/auth.store";

export default function InstitutionAdminProfilePage() {
  const authUser = useAuthStore((state) => state.user);
  const { data, isLoading, isError } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const profile = data?.profile ?? {
    firstName: authUser?.firstName ?? "",
    lastName: authUser?.lastName ?? "",
    email: authUser?.email ?? "",
    phone: authUser?.phone ?? "",
    avatarUrl: authUser?.avatarUrl ?? "",
    institutionName: authUser?.institutionName ?? "",
    institutionLogoUrl: authUser?.institutionLogoUrl ?? "",
    role: authUser?.role ?? "institution_admin",
  };
  const summary = data?.summary ?? {};

  const roleLabel =
    profile.role === "super_admin" ? "Super Admin" : "Institution Admin";
  // menuKeysCount is 0 for both "genuinely unrestricted" (menuKeys is null
  // server-side) and "restricted to nothing" — the latter is a degenerate
  // case that would make the account unusable, so 0 reads as unrestricted
  // in practice, same convention `filterNavByModules`/nav filtering already use.
  const accessLabel =
    (summary.menuKeysCount ?? 0) > 0
      ? `Restricted (${summary.menuKeysCount} menu items)`
      : "Full access";
  const institutionStatusLabel = summary.institutionStatus
    ? summary.institutionStatus.charAt(0).toUpperCase() +
      summary.institutionStatus.slice(1)
    : "—";

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
        onAvatarChange={(avatarUrl) =>
          updateProfile.mutate(
            { avatarUrl },
            {
              onError: (error) =>
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to update photo",
                ),
            },
          )
        }
      />

      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardHeader>
          <CardTitle className="text-primary">My Institution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar className="size-16 shrink-0 rounded-md" size="lg">
              <AvatarImage
                src={profile.institutionLogoUrl ?? ""}
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
                <p className="font-medium text-foreground">{accessLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="font-medium text-foreground">{roleLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p
                  className={cn(
                    "font-medium",
                    summary.institutionStatus === "active"
                      ? "text-emerald-600"
                      : "text-muted-foreground",
                  )}
                >
                  {institutionStatusLabel}
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
        onSave={async (values) => {
          await updateProfile.mutateAsync(values);
        }}
      />

      <ChangePasswordCard
        onChangePassword={(currentPassword, newPassword) =>
          changePassword.mutateAsync({ currentPassword, newPassword })
        }
      />
    </div>
  );
}
