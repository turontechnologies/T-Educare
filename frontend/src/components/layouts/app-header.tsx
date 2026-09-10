"use client";

import { useRouter } from "next/navigation";
import { Bell, GraduationCap, LogOut, Menu, Search, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth.store";

interface AppHeaderProps {
  onMenuClick: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?";

  const handleLogout = () => {
    logout();
    toast.success("You've been signed out");
    router.replace("/login");
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
          <GraduationCap className="size-5 shrink-0 text-primary" />
          <span className="truncate">
            Welcome,{" "}
            <span className="font-semibold">
              {user ? `${user.firstName} ${user.lastName}` : "Guest"}
            </span>
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
        <div className="relative hidden max-w-xs flex-1 md:block">
          <Input
            placeholder="Search here..."
            className="h-9 rounded-full pr-9"
          />
          <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="size-5" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<button type="button" aria-label="Account menu" />}
          >
            <Avatar className="shrink-0 transition-transform duration-200 hover:scale-105">
              <AvatarFallback className="bg-tertiary font-semibold text-tertiary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
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
