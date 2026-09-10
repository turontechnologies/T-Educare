"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Bus,
  ChevronRight,
  ClipboardCheck,
  Contact,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  School,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  expandable?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Registration", href: "/dashboard/registration", icon: UserPlus },
  {
    label: "Academics",
    href: "/dashboard/academics",
    icon: GraduationCap,
    expandable: true,
  },
  { label: "Student Management", href: "/dashboard/students", icon: Users },
  {
    label: "Staff Management",
    href: "/dashboard/staff",
    icon: Contact,
    expandable: true,
  },
  { label: "Lecture Management", href: "/dashboard/lectures", icon: School },
  { label: "Financials", href: "/dashboard/financials", icon: Wallet },
  {
    label: "Results Management",
    href: "/dashboard/results",
    icon: ClipboardCheck,
  },
  { label: "Hostel Management", href: "/dashboard/hostel", icon: Building2 },
  { label: "Transport Management", href: "/dashboard/transport", icon: Bus },
  {
    label: "Announcement",
    href: "/dashboard/announcements",
    icon: Megaphone,
  },
  { label: "Requests", href: "/dashboard/requests", icon: Inbox },
  { label: "Support", href: "/dashboard/support", icon: LifeBuoy },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-primary text-white lg:flex">
      <div className="flex items-center gap-2 bg-tertiary px-6 py-5 text-tertiary-foreground">
        <Logo variant="dark" size="sm" showWordmark={false} />
        <span className="text-lg leading-tight font-semibold">
          TEduCare <span className="font-normal opacity-70">TECH</span>
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ label, href, icon: Icon, expandable }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-tertiary before:absolute before:inset-y-1 before:left-0 before:w-1 before:rounded-full before:bg-tertiary"
                  : "text-white/80 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              <span className="flex-1">{label}</span>
              {expandable && <ChevronRight className="size-4 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-3 border-t border-white/10 px-6 py-4 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="size-4.5" />
        Logout
      </button>
    </aside>
  );
}
