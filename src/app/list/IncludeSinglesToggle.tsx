"use client";

import { Switch } from "@/design/atoms/Switch";

interface IncludeSinglesToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function IncludeSinglesToggle({ value, onChange }: Readonly<IncludeSinglesToggleProps>) {
  return <Switch label="Include singles & other releases" value={value} onChange={onChange} />;
}
