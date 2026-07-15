import type { ReactNode } from "react";
import { HStack, StackItem, VStack } from "../atoms/Stack";
import { Link } from "../atoms/Link";
import { Text } from "../atoms/Text";
import { Thumbnail } from "../atoms/Thumbnail";

export function AlbumRow({
  name,
  artistName,
  imageUrl,
  releaseYear,
  href,
  endContent,
}: {
  name: string;
  artistName: string;
  imageUrl?: string | null;
  releaseYear?: string;
  href?: string;
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
      {releaseYear && <Text type="supporting">{releaseYear}</Text>}
      {endContent}
    </HStack>
  );
}
