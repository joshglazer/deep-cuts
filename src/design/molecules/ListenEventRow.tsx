import { formatDate } from "@/lib/formatDate";
import { spotifyAlbumUri } from "@/lib/spotifyLinks";
import { HStack, StackItem, VStack } from "../atoms/Stack";
import { Link } from "../atoms/Link";
import { Text } from "../atoms/Text";
import { Thumbnail } from "../atoms/Thumbnail";

interface ListenEventRowEvent {
  trackName: string;
  playedAt: string;
  artistName?: string;
  albumName?: string;
  imageUrl?: string | null;
  spotifyAlbumId?: string | null;
}

interface ListenEventRowProps {
  event: ListenEventRowEvent;
  albumHref?: string;
}

export function ListenEventRow({ event, albumHref }: Readonly<ListenEventRowProps>) {
  const { trackName, playedAt, artistName, albumName, imageUrl, spotifyAlbumId } = event;
  const subtitle = [artistName, albumName].filter(Boolean).join(" · ");

  const thumbnail = (
    <Thumbnail src={imageUrl ?? undefined} label={trackName} alt="" className="w-14 h-14" />
  );

  return (
    <HStack gap="sm" vAlign="center" className="bg-surface rounded-lg p-2">
      {spotifyAlbumId ? (
        <Link
          href={spotifyAlbumUri(spotifyAlbumId)}
          target="_blank"
          isStandalone
          hasUnderline={false}
        >
          {thumbnail}
        </Link>
      ) : (
        thumbnail
      )}
      <StackItem size="fill">
        <VStack gap="sm">
          {albumHref ? (
            <Link href={albumHref} isStandalone color="primary" maxLines={1}>
              {trackName}
            </Link>
          ) : (
            <Text maxLines={1}>{trackName}</Text>
          )}
          {subtitle && (
            <Text type="supporting" color="secondary" maxLines={1}>
              {subtitle}
            </Text>
          )}
        </VStack>
      </StackItem>
      <Text type="supporting" color="secondary" maxLines={1}>
        {formatDate(playedAt)}
      </Text>
    </HStack>
  );
}
