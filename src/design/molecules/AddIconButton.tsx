"use client";

import { LuPlus } from "react-icons/lu";
import { Icon } from "../atoms/Icon";
import { IconButton, type IconButtonProps } from "../atoms/IconButton";

export function AddIconButton({
  label,
  href,
  variant = "ghost",
  className,
}: {
  label: string;
  href: string;
  variant?: IconButtonProps["variant"];
  className?: string;
}) {
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
