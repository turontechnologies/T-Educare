"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/config/nav";
import { AppHeader } from "@/components/layouts/app-header";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { MobileSidebar } from "@/components/layouts/mobile-sidebar";

interface AppShellProps {
  menu: NavItem[];
  brand: string;
  brandSuffix?: string;
  children: ReactNode;
}

/** The full authenticated shell — fixed desktop sidebar + mobile drawer + header + scrollable content — shared by /dashboard and /super-admin. */
export function AppShell({
  menu,
  brand,
  brandSuffix,
  children,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      <AppSidebar menu={menu} brand={brand} brandSuffix={brandSuffix} />
      <MobileSidebar
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        menu={menu}
        brand={brand}
        brandSuffix={brandSuffix}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <AppHeader onMenuClick={() => setMobileNavOpen(true)} />
        <main className="scrollbar-brand-light min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Keyed by route so every page change replays a fresh, obvious
              entrance transition instead of just snapping into place. */}
          <div
            key={pathname}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
