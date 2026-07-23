"use client";

import { ActivityHeatmap } from "./ActivityHeatmap";
import { computeStats, type ListenEventLike } from "./computeStats";
import { StatTile } from "./StatTile";
import { Grid } from "@/design/atoms/Grid";
import { VStack } from "@/design/atoms/Stack";
import { useHasMounted } from "@/lib/useHasMounted";

interface StatsViewProps {
  events: ListenEventLike[];
}

export function StatsView({ events }: Readonly<StatsViewProps>) {
  const hasMounted = useHasMounted();

  // Streak, week/month trends, and the heatmap all depend on the visitor's
  // local calendar day, which the server doesn't know — so they can only be
  // computed once this renders in the browser.
  if (!hasMounted) {
    return null;
  }

  const stats = computeStats(events, new Date());

  return (
    <VStack gap="lg">
      <Grid columns={{ minWidth: 200 }} gap={4}>
        <StatTile label="Total songs streamed" value={events.length} />
        <StatTile label="Day streak" value={stats.streakDays} />
        <StatTile label="This month" value={stats.thisMonth.count} trend={stats.thisMonth} />
        <StatTile label="This week" value={stats.thisWeek.count} trend={stats.thisWeek} />
      </Grid>
      <ActivityHeatmap days={stats.heatmap} />
    </VStack>
  );
}
