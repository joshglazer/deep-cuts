"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "../atoms/Icon";
import { IconButton } from "../atoms/IconButton";
import { MobileNav } from "../atoms/MobileNav";
import { SideNavItem } from "../atoms/SideNav";

interface HeaderMobileMenuProps {
  brand: ReactNode;
}

export function HeaderMobileMenu({ brand }: Readonly<HeaderMobileMenuProps>) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <IconButton
        icon={<Icon icon="menu" />}
        label="Open navigation"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
      />
      <MobileNav
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        header={brand}
        label="Deep Cuts"
        side="start"
      >
        <SideNavItem
          label="My Queue"
          href="/queue"
          isSelected={pathname === "/queue"}
          onClick={() => setIsOpen(false)}
        />
        <SideNavItem
          label="Add to Queue"
          href="/queue/search"
          isSelected={pathname?.startsWith("/queue/search") ?? false}
          onClick={() => setIsOpen(false)}
        />
      </MobileNav>
    </>
  );
}
