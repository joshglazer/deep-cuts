import { requireSpotifyUserIdOrRedirect } from "@/auth";
import { PageShell } from "@/components/PageShell";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { getStats } from "./statsData";
import { StatTile } from "./StatTile";
import { EmptyState } from "@/design/atoms/EmptyState";
import { Grid } from "@/design/atoms/Grid";
import { VStack } from "@/design/atoms/Stack";

export default async function StatsPage() {
  const spotifyUserId = await requireSpotifyUserIdOrRedirect();
  const stats = await getStats(spotifyUserId);

  return (
    <PageShell title="Stats">
      {stats.totalStreams === 0 ? (
        <EmptyState
          title="No listening history yet"
          description="Once you stream some tracks, your stats will show up here."
        />
      ) : (
        <VStack gap="lg">
          <Grid columns={{ minWidth: 200 }} gap={4}>
            <StatTile label="Total songs streamed" value={stats.totalStreams} />
            <StatTile label="This month" value={stats.thisMonth.count} trend={stats.thisMonth} />
            <StatTile label="This week" value={stats.thisWeek.count} trend={stats.thisWeek} />
            <StatTile label="Day streak" value={stats.streakDays} />
          </Grid>
          <ActivityHeatmap days={stats.heatmap} />
        </VStack>
      )}
    </PageShell>
  );
}
