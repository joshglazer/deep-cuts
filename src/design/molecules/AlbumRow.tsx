import type { ReactNode } from "react";
import { HStack, StackItem, VStack } from "../atoms/Stack";
import { Link } from "../atoms/Link";
import { ProgressBar } from "../atoms/ProgressBar";
import { Text } from "../atoms/Text";
import { Thumbnail } from "../atoms/Thumbnail";

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
  endContent,
}: {
  name: string;
  artistName: string;
  artistHref?: string;
  imageUrl?: string | null;
  spotifyAlbumId?: string;
  releaseYear?: string;
  totalTracks?: number;
  href?: string;
  progress?: { played: number; total: number };
  endContent?: ReactNode;
}) {
  const showProgress = progress && progress.played > 0;

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
                      label={`${progress.played} of ${progress.total} tracks played`}
                      isLabelHidden
                      value={progress.played}
                      max={progress.total}
                      variant="accent"
                    />
                  </StackItem>
                )}
                <Text type="supporting" maxLines={1}>
                  {showProgress
                    ? `${progress.played}/${progress.total} tracks`
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
