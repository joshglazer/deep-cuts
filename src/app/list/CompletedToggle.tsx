"use client";

import { Switch } from "@/design/atoms/Switch";
import { useSearchParamUpdater } from "./useSearchParamUpdater";

interface CompletedToggleProps {
  showCompleted: boolean;
}

export function CompletedToggle({ showCompleted }: Readonly<CompletedToggleProps>) {
  const setSearchParam = useSearchParamUpdater();

  return (
    <Switch
      label="Show completed"
      value={showCompleted}
      onChange={(checked) => setSearchParam("completed", checked ? "show" : null)}
    />
  );
}
