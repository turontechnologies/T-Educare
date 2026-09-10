"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import { toast } from "sonner";
import type { NavItem } from "@/config/nav";
import { Logo } from "@/components/shared/logo";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

interface SidebarContentProps {
  menu: NavItem[];
  brand: string;
  brandSuffix?: string;
  /** Called on any nav click — the mobile drawer uses this to close itself. */
  onNavigate?: () => void;
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Locked to the supplied Figma reference — icons are always gold, only the
 * label color and the group chevron's rotation change with state. Do not
 * restyle this without a new reference screenshot (see frontend/CLAUDE.md).
 */
function NavLeaf({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "text-tertiary" : "text-white/90 hover:text-white",
      )}
    >
      <Icon className="size-4.5 shrink-0 text-tertiary" />
      <span className="flex-1">{item.label}</span>
    </Link>
  );
}

function NavGroup({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const children = item.children ?? [];
  const childActive = children.some((child) =>
    isActivePath(pathname, child.href),
  );
  const [open, setOpen] = useState(childActive);
  const Icon = item.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          open ? "text-tertiary" : "text-white/90 hover:text-white",
        )}
      >
        <Icon className="size-4.5 shrink-0 text-tertiary" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronRight
          className={cn(
            "size-4 shrink-0 text-tertiary transition-transform duration-300",
            open && "rotate-90",
          )}
        />
      </button>

      {/* Animate height via grid-template-rows so it doesn't need a measured pixel height. */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-0.5 py-1 pl-11">
            {children.map((child) => {
              const active = isActivePath(pathname, child.href);
              return (
                <Link
                  key={child.key}
                  href={child.href}
                  onClick={onNavigate}
                  className={cn(
                    "rounded-md px-2 py-2 text-sm transition-colors",
                    active
                      ? "font-medium text-tertiary"
                      : "text-white/80 hover:text-white",
                  )}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The actual sidebar chrome — shared between the fixed desktop `<aside>` and the mobile drawer. */
export function SidebarContent({
  menu,
  brand,
  brandSuffix,
  onNavigate,
}: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    toast.success("You've been signed out");
    router.replace("/login");
  };

  return (
    <div className="flex h-full w-full flex-col bg-primary">
      <div className="flex shrink-0 items-center gap-2 bg-tertiary px-6 py-5">
        <span className="relative inline-flex">
          <Logo variant="light" size="sm" showWordmark={false} />
          <span
            aria-hidden
            className="absolute -top-2 left-4 flex size-4 items-center justify-center rounded-full bg-[#8B5CF6] text-[9px] font-semibold text-white ring-2 ring-tertiary"
          >
            C
          </span>
        </span>
        <span className="text-lg leading-tight font-semibold text-white">
          {brand}
          {brandSuffix && (
            <span className="font-normal text-white/80"> {brandSuffix}</span>
          )}
        </span>
      </div>

      <nav className="scrollbar-brand min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {menu.map((item) =>
          item.children && item.children.length > 0 ? (
            <NavGroup
              key={item.key}
              item={item}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ) : (
            <NavLeaf
              key={item.key}
              item={item}
              active={isActivePath(pathname, item.href)}
              onNavigate={onNavigate}
            />
          ),
        )}
      </nav>

      <div className="mx-4 shrink-0 border-t border-dashed border-secondary" />
      <button
        type="button"
        onClick={handleLogout}
        className="flex shrink-0 cursor-pointer items-center gap-3 px-6 py-4 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="size-4.5" />
        Logout
      </button>
    </div>
  );
}

interface AppSidebarProps {
  menu: NavItem[];
  brand: string;
  brandSuffix?: string;
}

/** Desktop-only fixed sidebar. Below `lg`, `<MobileSidebar>` renders the same content in a drawer. */
export function AppSidebar({ menu, brand, brandSuffix }: AppSidebarProps) {
  return (
    <aside className="hidden h-full w-64 shrink-0 lg:flex lg:flex-col">
      <SidebarContent menu={menu} brand={brand} brandSuffix={brandSuffix} />
    </aside>
  );
}
