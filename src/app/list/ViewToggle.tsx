"use client";

import { SegmentedControl } from "@/design/atoms/SegmentedControl";
import { useSearchParamUpdater } from "./useSearchParamUpdater";

interface ViewToggleProps {
  view: "flat" | "artist";
}

export function ViewToggle({ view }: Readonly<ViewToggleProps>) {
  const setSearchParam = useSearchParamUpdater();

  return (
    <SegmentedControl
      value={view}
      onChange={(value) => setSearchParam("view", value === "artist" ? "artist" : null)}
      label="List view"
      options={[
        { value: "flat", label: "Albums" },
        { value: "artist", label: "Artists" },
      ]}
    />
  );
}
