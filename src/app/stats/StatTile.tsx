import type { TrendStat } from "./statsData";
import { TrendBadge } from "./TrendBadge";
import { Card } from "@/design/atoms/Card";
import { Heading } from "@/design/atoms/Heading";
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
