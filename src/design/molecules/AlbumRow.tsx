import type { ReactNode } from "react";
import { formatCompletedDate } from "@/lib/formatDate";
import { HStack, StackItem, VStack } from "../atoms/Stack";
import { Icon } from "../atoms/Icon";
import { Link } from "../atoms/Link";
import { ProgressBar } from "../atoms/ProgressBar";
import { Text } from "../atoms/Text";
import { Thumbnail } from "../atoms/Thumbnail";
import { Tooltip } from "../atoms/Tooltip";

interface AlbumRowProps {
  name: string;
  artistName: string;
  artistHref?: string;
  imageUrl?: string | null;
  spotifyAlbumId?: string;
  releaseYear?: string;
  totalTracks?: number;
  href?: string;
  progress?: { played: number; total: number };
  completedAt?: string | null;
  endContent?: ReactNode;
}

export function AlbumRow({
  name,
  artistName,
  artistHref,
  imageUrl,
  spotifyAlbumId,
  releaseYear,
  totalTracks,
  href,
  progress,
  completedAt,
  endContent,
}: Readonly<AlbumRowProps>) {
  const isCompleted = Boolean(completedAt);
  const showProgress = progress && (isCompleted || progress.played > 0);
  // Completed albums always render as fully played, even if a stale
  // `progress.played` (e.g. a track later removed from the album) would say
  // otherwise — completion is the source of truth once it's set.
  const playedCount = progress && isCompleted ? progress.total : progress?.played;

  const thumbnail = (
    <Thumbnail
      src={imageUrl ?? undefined}
      label={name}
      alt=""
      className="w-22 h-22"
    />
  );

  return (
    <VStack gap="sm" className="bg-surface rounded-lg p-2">
      <HStack gap="sm" vAlign="center">
        {spotifyAlbumId ? (
          <Link
            href={`spotify:album:${spotifyAlbumId}`}
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
            {href ? (
              <Link href={href} isStandalone color="primary" maxLines={1}>
                {name}
              </Link>
            ) : (
              <Text maxLines={1}>{name}</Text>
            )}
            {artistHref ? (
              <Link
                href={artistHref}
                isStandalone
                type="supporting"
                color="secondary"
                maxLines={1}
              >
                {artistName}
              </Link>
            ) : (
              <Text type="supporting" maxLines={1}>
                {artistName}
              </Text>
            )}
            {progress && (
              <HStack gap="sm" vAlign="center">
                {showProgress && (
                  <StackItem size="fill">
                    <ProgressBar
                      label={`${playedCount} of ${progress.total} tracks played`}
                      isLabelHidden
                      value={playedCount}
                      max={progress.total}
                      variant="accent"
                    />
                  </StackItem>
                )}
                {completedAt && (
                  <Tooltip content={`Completed ${formatCompletedDate(completedAt)}`}>
                    <Icon icon="check" color="success" size="sm" />
                  </Tooltip>
                )}
                <Text type="supporting" maxLines={1}>
                  {showProgress
                    ? `${playedCount}/${progress.total} tracks`
                    : `${progress.total} tracks`}
                </Text>
              </HStack>
            )}
            {!progress && (releaseYear || totalTracks !== undefined) && (
              <Text type="supporting" maxLines={1}>
                {[releaseYear, totalTracks !== undefined ? `${totalTracks} tracks` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            )}
          </VStack>
        </StackItem>
        {endContent}
      </HStack>
    </VStack>
  );
}
