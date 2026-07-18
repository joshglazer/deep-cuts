"use client";

import { LuPlus } from "react-icons/lu";
import { Icon } from "../atoms/Icon";
import { IconButton, type IconButtonProps } from "../atoms/IconButton";

interface AddIconButtonProps {
  label: string;
  href: string;
  variant?: IconButtonProps["variant"];
  className?: string;
}

export function AddIconButton({
  label,
  href,
  variant = "ghost",
  className,
}: Readonly<AddIconButtonProps>) {
  return (
    <IconButton
      icon={<Icon icon={LuPlus} size="sm" />}
      label={label}
      tooltip={label}
      href={href}
      variant={variant}
      size="sm"
      className={className}
    />
  );
}
