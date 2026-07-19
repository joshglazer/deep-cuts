"use client";

import { LuTrendingDown, LuTrendingUp } from "react-icons/lu";
import type { TrendStat } from "./statsData";
import { Badge } from "@/design/atoms/Badge";
import { Icon } from "@/design/atoms/Icon";

interface TrendBadgeProps {
  trend: TrendStat;
}

export function TrendBadge({ trend }: Readonly<TrendBadgeProps>) {
  const { count, previousCount } = trend;

  if (previousCount === 0) {
    return count > 0 ? <Badge variant="success" label="New activity" /> : null;
  }

  const percentChange = Math.round(((count - previousCount) / previousCount) * 100);
  if (percentChange === 0) {
    return <Badge variant="neutral" label="No change" />;
  }

  const isUp = percentChange > 0;
  return (
    <Badge
      variant={isUp ? "success" : "error"}
      icon={<Icon icon={isUp ? LuTrendingUp : LuTrendingDown} size="sm" />}
      label={`${isUp ? "+" : ""}${percentChange}% vs last period`}
    />
  );
}
