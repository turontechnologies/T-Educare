import {
  BadgeCheck,
  Bell,
  Boxes,
  Building2,
  Bus,
  CalendarRange,
  ClipboardCheck,
  Contact,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  Megaphone,
  School,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  /** Stable identifier used by the RBAC role system — never reuse or repurpose a key once a Role references it. */
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
}

export const INSTITUTION_NAV: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "registration",
    label: "Registration",
    href: "/dashboard/registration",
    icon: UserPlus,
  },
  {
    key: "academics",
    label: "Academics",
    href: "/dashboard/academics",
    icon: GraduationCap,
    children: [
      {
        key: "academics.sessions",
        label: "Session Management",
        href: "/dashboard/academics/sessions",
        icon: CalendarRange,
      },
      {
        key: "academics.schools",
        label: "School Management",
        href: "/dashboard/academics/schools",
        icon: School,
      },
      {
        key: "academics.faculties",
        label: "Faculty Management",
        href: "/dashboard/academics/faculties",
        icon: Building2,
      },
      {
        key: "academics.departments",
        label: "Department Management",
        href: "/dashboard/academics/departments",
        icon: Boxes,
      },
      {
        key: "academics.programs",
        label: "Program Management",
        href: "/dashboard/academics/programs",
        icon: LayoutGrid,
      },
      {
        key: "academics.program-levels",
        label: "Program Levels",
        href: "/dashboard/academics/program-levels",
        icon: BadgeCheck,
      },
      {
        key: "academics.course-grades",
        label: "Courses Grades",
        href: "/dashboard/academics/course-grades",
        icon: ClipboardCheck,
      },
      {
        key: "academics.courses",
        label: "Courses Management",
        href: "/dashboard/academics/courses",
        icon: School,
      },
    ],
  },
  {
    key: "students",
    label: "Student Management",
    href: "/dashboard/students",
    icon: Users,
  },
  {
    key: "staff",
    label: "Staff Management",
    href: "/dashboard/staff",
    icon: Contact,
    children: [
      {
        key: "staff.designation",
        label: "Designation",
        href: "/dashboard/staff/designation",
        icon: BadgeCheck,
      },
      {
        key: "staff.all",
        label: "All Staff",
        href: "/dashboard/staff/all",
        icon: Users,
      },
    ],
  },
  {
    key: "user-management",
    label: "User Management",
    href: "/dashboard/user-management",
    icon: UserCog,
  },
  {
    key: "lectures",
    label: "Lecture Management",
    href: "/dashboard/lectures",
    icon: School,
  },
  {
    key: "financials",
    label: "Financials",
    href: "/dashboard/financials",
    icon: Wallet,
  },
  {
    key: "results",
    label: "Results Management",
    href: "/dashboard/results",
    icon: ClipboardCheck,
  },
  {
    key: "hostel",
    label: "Hostel Management",
    href: "/dashboard/hostel",
    icon: Building2,
  },
  {
    key: "transport",
    label: "Transport Management",
    href: "/dashboard/transport",
    icon: Bus,
  },
  {
    key: "announcements",
    label: "Announcement",
    href: "/dashboard/announcements",
    icon: Megaphone,
  },
  {
    key: "requests",
    label: "Requests",
    href: "/dashboard/requests",
    icon: Inbox,
  },
  {
    key: "support",
    label: "Support",
    href: "/dashboard/support",
    icon: LifeBuoy,
  },
];

export const SUPER_ADMIN_NAV: NavItem[] = [
  {
    key: "sa.dashboard",
    label: "Dashboard",
    href: "/super-admin",
    icon: LayoutDashboard,
  },
  {
    key: "sa.institutions",
    label: "Institutions",
    href: "/super-admin/institutions",
    icon: Building2,
  },
  {
    key: "sa.user-manager",
    label: "User Manager",
    href: "/super-admin/user-manager",
    icon: UserCog,
  },
  {
    key: "sa.modules",
    label: "Modules",
    href: "/super-admin/modules",
    icon: Boxes,
  },
  {
    key: "sa.license-manager",
    label: "License Manager",
    href: "/super-admin/license-manager",
    icon: ShieldCheck,
  },
  {
    key: "sa.notifications",
    label: "Notifications",
    href: "/super-admin/notifications",
    icon: Bell,
  },
];

/** Flat list of every key (parents + leaves) in a nav tree — used to seed the "full access" role. */
export function collectAllMenuKeys(items: NavItem[]): string[] {
  return items.flatMap((item) => [
    item.key,
    ...(item.children ? collectAllMenuKeys(item.children) : []),
  ]);
}

/**
 * Filters a nav tree down to what a role can see. `allowedKeys === null` means
 * unrestricted (the institution's root admin, or any system role). A parent
 * survives if it's explicitly allowed or if any of its children are.
 */
export function filterNavByAccess(
  items: NavItem[],
  allowedKeys: string[] | null,
): NavItem[] {
  if (allowedKeys === null) return items;
  const allowed = new Set(allowedKeys);

  const walk = (list: NavItem[]): NavItem[] =>
    list.reduce<NavItem[]>((acc, item) => {
      const children = item.children ? walk(item.children) : undefined;
      const isAllowed =
        allowed.has(item.key) || (children && children.length > 0);
      if (isAllowed) {
        acc.push(children ? { ...item, children } : item);
      }
      return acc;
    }, []);

  return walk(items);
}
