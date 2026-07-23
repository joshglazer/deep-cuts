import type { RecentActivityItem } from "./activityData";
import { albumHref } from "@/app/list/routes";
import { ListenEventRow } from "@/design/molecules/ListenEventRow";
import { VStack } from "@/design/atoms/Stack";

interface ActivityListProps {
  activity: RecentActivityItem[];
}

export function ActivityList({ activity }: Readonly<ActivityListProps>) {
  return (
    <VStack gap="sm">
      {activity.map((event) => (
        <ListenEventRow
          key={event.id}
          event={event}
          albumHref={event.spotifyAlbumId ? albumHref(event.spotifyAlbumId) : undefined}
        />
      ))}
    </VStack>
  );
}
