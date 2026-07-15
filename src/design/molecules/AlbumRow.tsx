import type { ReactNode } from "react";
import { HStack, StackItem, VStack } from "../atoms/Stack";
import { Link } from "../atoms/Link";
import { ProgressBar } from "../atoms/ProgressBar";
import { Text } from "../atoms/Text";
import { Thumbnail } from "../atoms/Thumbnail";

export function AlbumRow({
  name,
  artistName,
  imageUrl,
  href,
  progress,
  endContent,
}: {
  name: string;
  artistName: string;
  imageUrl?: string | null;
  href?: string;
  progress?: { played: number; total: number };
  endContent?: ReactNode;
}) {
  return (
    <HStack gap="sm" vAlign="center">
      <Thumbnail src={imageUrl ?? undefined} label={name} alt="" />
      <StackItem size="fill">
        <VStack gap="sm">
          {href ? (
            <Link href={href} isStandalone color="primary">
              {name}
            </Link>
          ) : (
            <Text maxLines={1}>{name}</Text>
          )}
          <Text type="supporting" maxLines={1}>
            {artistName}
          </Text>
        </VStack>
      </StackItem>
      {progress && (
        <VStack gap="sm" className="w-28">
          <ProgressBar
            label={`${progress.played} of ${progress.total} tracks played`}
            isLabelHidden
            value={progress.played}
            max={progress.total}
            variant="accent"
          />
          <Text type="supporting" maxLines={1}>
            {progress.played}/{progress.total} tracks
          </Text>
        </VStack>
      )}
      {endContent}
    </HStack>
  );
}
