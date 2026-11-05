"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useStudentAuthStore } from "@/store/student-auth.store";
import type { StudentAuthProfile } from "@/types/student-auth";

export function DashboardHeader({ student }: { student: StudentAuthProfile }) {
  const router = useRouter();
  const logout = useStudentAuthStore((state) => state.logout);
  const slug = student.institutionSlug;

  const handleLogout = () => {
    logout();
    router.push(slug ? `/${slug}/login` : "/");
  };

  return (
    <header
      className="border-b border-border bg-primary"
      style={
        student.institutionBrandColor
          ? ({
              "--primary": student.institutionBrandColor,
            } as React.CSSProperties)
          : undefined
      }
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            <AvatarImage
              src={student.institutionLogoUrl ?? undefined}
              alt={student.institutionName}
            />
            <AvatarFallback className="bg-white/10 text-white">
              {student.institutionName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-medium text-white">
            {student.institutionName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-white">
              {student.firstName} {student.lastName}
            </p>
            <p className="text-xs text-white/70">{student.matricNo}</p>
          </div>
          <Avatar size="sm">
            <AvatarImage
              src={student.avatarUrl ?? undefined}
              alt={`${student.firstName} ${student.lastName}`}
            />
            <AvatarFallback className="bg-white/10 text-white">
              {student.firstName.slice(0, 1)}
              {student.lastName.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Log out"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
