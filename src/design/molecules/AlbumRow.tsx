import type { ReactNode } from "react";
import { HStack, StackItem } from "../atoms/Stack";
import { Text } from "../atoms/Text";
import { Thumbnail } from "../atoms/Thumbnail";

export function AlbumRow({
  name,
  artistName,
  imageUrl,
  endContent,
}: {
  name: string;
  artistName: string;
  imageUrl?: string | null;
  endContent?: ReactNode;
}) {
  return (
    <HStack gap="sm" vAlign="center">
      <Thumbnail src={imageUrl ?? undefined} label={name} alt="" />
      <StackItem size="fill">
        <Text maxLines={1}>
          {name} — {artistName}
        </Text>
      </StackItem>
      {endContent}
    </HStack>
  );
}
