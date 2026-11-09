"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { StudentAuthProfile } from "@/types/student-auth";

export function DashboardHeader({ student }: { student: StudentAuthProfile }) {
  const initials =
    `${student.firstName[0] ?? ""}${student.lastName[0] ?? ""}`.toUpperCase();

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <p className="text-sm text-muted-foreground">
        Welcome,{" "}
        <span className="font-medium text-foreground">
          {student.firstName} {student.lastName}
        </span>{" "}
        · {student.matricNo}
      </p>

      <Avatar size="sm">
        <AvatarImage
          src={student.avatarUrl ?? undefined}
          alt={`${student.firstName} ${student.lastName}`}
        />
        <AvatarFallback className="bg-tertiary text-tertiary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}
