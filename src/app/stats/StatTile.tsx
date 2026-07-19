"use client";

import { LuTrendingDown, LuTrendingUp } from "react-icons/lu";
import type { TrendStat } from "./statsData";
import { Badge } from "@/design/atoms/Badge";
import { Card } from "@/design/atoms/Card";
import { Heading } from "@/design/atoms/Heading";
import { Icon } from "@/design/atoms/Icon";
import { VStack } from "@/design/atoms/Stack";
import { Text } from "@/design/atoms/Text";

interface StatTileProps {
  label: string;
  value: number;
  trend?: TrendStat;
}

export function StatTile({ label, value, trend }: Readonly<StatTileProps>) {
  return (
    <Card>
      <VStack gap="sm">
        <Text type="supporting">{label}</Text>
        <Heading level={2}>{value.toLocaleString()}</Heading>
        {trend && <TrendBadge trend={trend} />}
      </VStack>
    </Card>
  );
}

function TrendBadge({ trend }: Readonly<{ trend: TrendStat }>) {
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
