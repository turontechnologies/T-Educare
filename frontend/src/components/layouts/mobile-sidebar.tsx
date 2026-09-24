"use client";

import type { NavItem } from "@/config/nav";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/layouts/app-sidebar";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu: NavItem[];
  brand: string;
  brandSuffix?: string;
  logoSrc?: string;
}

export function MobileSidebar({
  open,
  onOpenChange,
  menu,
  brand,
  brandSuffix,
  logoSrc,
}: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-72 border-none bg-primary p-0 sm:max-w-72"
      >
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <SidebarContent
          menu={menu}
          brand={brand}
          brandSuffix={brandSuffix}
          logoSrc={logoSrc}
          onNavigate={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
