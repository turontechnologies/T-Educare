"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  GraduationCap,
  LogOut,
  Menu,
  Search,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { NotificationsBell } from "@/components/features/notifications/notifications-bell";
import type { NavItem } from "@/config/nav";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { useInstitutionsStore } from "@/store/institutions.store";

interface AppHeaderProps {
  menu: NavItem[];
  onMenuClick: () => void;
}

function flattenNavItems(items: NavItem[], collection: NavItem[] = []) {
  items.forEach((item) => {
    collection.push(item);
    if (item.children?.length) {
      flattenNavItems(item.children, collection);
    }
  });
  return collection;
}

export function AppHeader({ menu, onMenuClick }: AppHeaderProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const institutions = useInstitutionsStore((state) => state.institutions);
  const [query, setQuery] = useState("");

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    return flattenNavItems(menu)
      .filter((item) => item.label.toLowerCase().includes(normalized))
      .slice(0, 8);
  }, [menu, query]);

  // The live institutions store (real backend data) wins once hydrated;
  // the auth snapshot from login is the fallback so the name/logo show
  // immediately without waiting on that separate fetch.
  const liveInstitution =
    user?.role === "institution_admin"
      ? institutions.find((i) => i.id === user.institutionId)
      : undefined;
  const institutionDisplayName = liveInstitution?.name ?? user?.institutionName;
  const institutionLogoUrl =
    liveInstitution?.logoUrl ?? user?.institutionLogoUrl;
  const institution =
    user?.role === "institution_admin" && institutionDisplayName
      ? { name: institutionDisplayName, logoUrl: institutionLogoUrl }
      : undefined;

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?";

  const handleProfile = () => {
    router.push(
      user?.role === "super_admin"
        ? "/super-admin/profile"
        : "/dashboard/profile",
    );
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Keep the UX resilient even if the API is temporarily unavailable.
    } finally {
      logout();
      toast.success("You've been signed out");
      router.replace("/login");
    }
  };

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-4 sm:gap-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="size-5" />
        </Button>

        <div className="hidden min-w-0 items-center gap-2 text-sm font-medium text-foreground sm:flex">
          {institution ? (
            <Avatar className="size-8 shrink-0 rounded-md" size="sm">
              <AvatarImage
                src={institution.logoUrl}
                alt={institution.name}
                className="rounded-md object-cover"
              />
              <AvatarFallback className="rounded-md bg-muted">
                <Building2 className="size-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <GraduationCap className="size-5 shrink-0 text-primary" />
          )}
          <span className="truncate">
            Welcome,{" "}
            <span className="font-semibold">
              {user ? `${user.firstName} ${user.lastName}` : "Guest"}
            </span>
            {institution && (
              <span className="text-muted-foreground">
                {" "}
                · {institution.name}
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
        <div className="relative hidden max-w-xs flex-1 md:block">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages..."
            className="h-9 rounded-full pr-9"
          />
          <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />

          {query.trim() && (
            <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
              {searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setQuery("");
                      router.push(item.href);
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      <item.icon className="size-4 text-muted-foreground" />
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground">Open</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No pages match your search.
                </div>
              )}
            </div>
          )}
        </div>

        <NotificationsBell />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<button type="button" aria-label="Account menu" />}
          >
            <Avatar className="shrink-0 transition-transform duration-200 hover:scale-105">
              <AvatarImage
                src={user?.avatarUrl}
                alt={user ? `${user.firstName} ${user.lastName}` : "Account"}
              />
              <AvatarFallback className="bg-tertiary font-semibold text-tertiary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleProfile}>
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
