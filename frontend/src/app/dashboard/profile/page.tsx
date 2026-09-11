"use client";

import { useMemo, useState } from "react";
import { Building2, Eye, EyeOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { ChangePasswordCard } from "@/components/features/profile/change-password-card";
import { PersonalInfoCard } from "@/components/features/profile/personal-info-card";
import { ProfileHeroCard } from "@/components/features/profile/profile-hero-card";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useInstitutionsStore } from "@/store/institutions.store";
import { useRbacStore } from "@/store/rbac.store";
import { useUserManagersStore } from "@/store/user-managers.store";

export default function InstitutionAdminProfilePage() {
  const authUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const userManagers = useUserManagersStore((state) => state.userManagers);
  const updateUserManager = useUserManagersStore(
    (state) => state.updateUserManager,
  );
  const institutions = useInstitutionsStore((state) => state.institutions);
  const roles = useRbacStore((state) => state.roles);
  const [tokenRevealed, setTokenRevealed] = useState(false);

  const account = useMemo(
    () => userManagers.find((u) => u.id === authUser?.id),
    [userManagers, authUser?.id],
  );
  const institution = useMemo(
    () => institutions.find((i) => i.id === authUser?.institutionId),
    [institutions, authUser?.institutionId],
  );
  const role = useMemo(
    () => roles.find((r) => r.id === authUser?.roleId),
    [roles, authUser?.roleId],
  );

  if (!authUser || !account) return null;

  const roleLabel =
    !authUser.roleId || role?.isSystem
      ? "Institution Admin — Full Access"
      : (role?.name ?? "Institution Admin");

  const syncSession = (patch: Partial<typeof authUser>) => {
    setUser({ ...authUser, ...patch });
  };

  return (
    <div className="space-y-6">
      <PageHeader breadcrumb={["Administrator", "Profile"]} />

      <ProfileHeroCard
        firstName={account.firstName}
        lastName={account.lastName}
        email={account.email}
        phone={account.phone}
        avatarUrl={account.avatarUrl}
        roleLabel={roleLabel}
        subtitle={institution?.name}
        onAvatarChange={(url) => {
          updateUserManager(account.id, { avatarUrl: url });
          syncSession({ avatarUrl: url });
        }}
      />

      {institution && (
        <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
          <CardHeader>
            <CardTitle className="text-primary">My Institution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar className="size-16 shrink-0 rounded-md" size="lg">
                <AvatarImage
                  src={institution.logoUrl}
                  alt={institution.name}
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
                    {institution.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium text-foreground">
                    {institution.institutionType}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Country/State</p>
                  <p className="font-medium text-foreground">
                    {institution.countryState}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p
                    className={cn(
                      "font-medium capitalize",
                      institution.status === "active"
                        ? "text-emerald-600"
                        : "text-destructive",
                    )}
                  >
                    {institution.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">License Type</p>
                  <p className="font-medium text-foreground">
                    {institution.licenseType}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Active Modules
                  </p>
                  <p className="font-medium text-foreground">
                    {institution.moduleKeys.length}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Token Key</p>
                  <button
                    type="button"
                    onClick={() => setTokenRevealed((v) => !v)}
                    aria-label={
                      tokenRevealed ? "Hide token key" : "Show token key"
                    }
                    className="inline-flex cursor-pointer items-center gap-1.5 font-mono font-medium text-foreground"
                  >
                    {tokenRevealed ? institution.tokenKey : "••••••••••"}
                    {tokenRevealed ? (
                      <EyeOff className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <Eye className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <PersonalInfoCard
        defaultValues={{
          firstName: account.firstName,
          lastName: account.lastName,
          email: account.email,
          phone: account.phone,
        }}
        onSave={(values) => {
          updateUserManager(account.id, values);
          syncSession(values);
        }}
      />

      <ChangePasswordCard
        currentPassword={account.password}
        onChangePassword={(newPassword) =>
          updateUserManager(account.id, { password: newPassword })
        }
      />
    </div>
  );
}
