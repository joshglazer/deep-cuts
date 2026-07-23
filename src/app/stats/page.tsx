import { requireSpotifyUserIdOrRedirect } from "@/auth";
import { PageShell } from "@/components/PageShell";
import { getListenEvents } from "./statsData";
import { StatsView } from "./StatsView";
import { EmptyState } from "@/design/atoms/EmptyState";

export default async function StatsPage() {
  const spotifyUserId = await requireSpotifyUserIdOrRedirect();
  const events = await getListenEvents(spotifyUserId);

  return (
    <PageShell title="Stats">
      {events.length === 0 ? (
        <EmptyState
          title="No listening history yet"
          description="Once you stream some tracks, your stats will show up here."
        />
      ) : (
        <StatsView events={events} />
      )}
    </PageShell>
  );
}
