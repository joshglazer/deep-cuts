"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Switch } from "@/design/atoms/Switch";

export function CompletedToggle({ showCompleted }: { showCompleted: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(checked: boolean) {
    const params = new URLSearchParams(searchParams);
    if (checked) {
      params.set("completed", "show");
    } else {
      params.delete("completed");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Switch
      label="Show completed"
      value={showCompleted}
      onChange={handleChange}
    />
  );
}
