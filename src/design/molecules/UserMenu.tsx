"use client";

import { useState } from "react";
import { Avatar } from "../atoms/Avatar";
import { DropdownMenu } from "../atoms/DropdownMenu";

interface UserMenuProps {
  name?: string | null;
  image?: string | null;
  onSignOut: () => void;
}

export function UserMenu({ name, image, onSignOut }: Readonly<UserMenuProps>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <DropdownMenu
        isMenuOpen={isOpen}
        onOpenChange={setIsOpen}
        hasChevron={false}
        button={{
          label: name ?? "Account",
          icon: <Avatar src={image ?? undefined} name={name ?? undefined} size="small" />,
          isIconOnly: true,
          variant: "ghost",
          size: "sm",
        }}
        items={[{ label: "Sign out", onClick: onSignOut }]}
      />
    </div>
  );
}
