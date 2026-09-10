"use client";

import { useRouter } from "next/navigation";
import { Bell, GraduationCap, LogOut, Search, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth.store";

export function DashboardHeader() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?";

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <GraduationCap className="size-5 text-primary" />
        <span>
          Welcome,{" "}
          <span className="font-semibold">
            {user ? `${user.firstName} ${user.lastName}` : "Guest"}
          </span>
        </span>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3 sm:gap-4">
        <div className="relative hidden max-w-xs flex-1 sm:block">
          <Input
            placeholder="Search here..."
            className="h-9 rounded-full pr-9"
          />
          <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="size-5" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<button type="button" aria-label="Account menu" />}
          >
            <Avatar>
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
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
            >
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
