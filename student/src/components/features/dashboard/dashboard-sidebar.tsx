"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Calendar,
  Folder,
  Headphones,
  LayoutGrid,
  LogOut,
  PencilLine,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useStudentAuthStore } from "@/store/student-auth.store";
import type { StudentAuthProfile } from "@/types/student-auth";

interface NavItem {
  label: string;
  icon: typeof LayoutGrid;
  href?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutGrid, href: "dashboard" },
  { label: "Course Registration", icon: PencilLine },
  { label: "Timetable", icon: Calendar },
  { label: "Results", icon: Award },
  { label: "Hostel Management", icon: Folder },
  { label: "Bills", icon: Receipt, href: "bills" },
  { label: "Support", icon: Headphones },
];

export function DashboardSidebar({ student }: { student: StudentAuthProfile }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useStudentAuthStore((state) => state.logout);
  const slug = student.institutionSlug;

  const handleLogout = () => {
    logout();
    router.push(slug ? `/${slug}/login` : "/");
  };

  return (
    <aside
      className="flex w-60 shrink-0 flex-col bg-primary text-white"
      style={
        student.institutionBrandColor
          ? ({
              "--primary": student.institutionBrandColor,
            } as React.CSSProperties)
          : undefined
      }
    >
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Avatar size="sm" className="ring-2 ring-white/20">
          <AvatarImage
            src={student.institutionLogoUrl ?? undefined}
            alt={student.institutionName}
          />
          <AvatarFallback className="bg-white/10 text-white">
            {student.institutionName.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-semibold">
          {student.institutionName}
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const href = item.href && slug ? `/${slug}/${item.href}` : undefined;
          const active = !!href && pathname?.startsWith(href);
          const Icon = item.icon;

          if (!href) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => toast.info(`${item.label} is coming soon.`)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white/80"
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={href}
              className={
                active
                  ? "flex items-center gap-3 rounded-md bg-white/10 px-3 py-2.5 text-sm font-medium text-tertiary"
                  : "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/90 transition-colors hover:bg-white/5"
              }
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-5">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-white/90 transition-colors hover:bg-white/5"
        >
          <LogOut className="size-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
