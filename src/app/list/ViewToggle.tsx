"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SegmentedControl } from "@/design/atoms/SegmentedControl";

interface ViewToggleProps {
  view: "flat" | "artist";
}

export function ViewToggle({ view }: Readonly<ViewToggleProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === "artist") {
      params.set("view", "artist");
    } else {
      params.delete("view");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <SegmentedControl
      value={view}
      onChange={handleChange}
      label="List view"
      options={[
        { value: "flat", label: "Albums" },
        { value: "artist", label: "Artists" },
      ]}
    />
  );
}
