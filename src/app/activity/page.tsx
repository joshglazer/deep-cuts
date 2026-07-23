import { requireSpotifyUserIdOrRedirect } from "@/auth";
import { PageShell } from "@/components/PageShell";
import { ActivityList } from "./ActivityList";
import { getRecentActivity } from "./activityData";
import { EmptyState } from "@/design/atoms/EmptyState";

export default async function ActivityPage() {
  const spotifyUserId = await requireSpotifyUserIdOrRedirect();
  const activity = await getRecentActivity(spotifyUserId);

  return (
    <PageShell title="Recent Activity">
      {activity.length === 0 ? (
        <EmptyState
          title="No listening history yet"
          description="Once you stream some tracks, your recent activity will show up here."
        />
      ) : (
        <ActivityList activity={activity} />
      )}
    </PageShell>
  );
}
