import type { ReactNode } from "react";
import { HStack, StackItem } from "../atoms/Stack";
import { Link } from "../atoms/Link";
import { Text } from "../atoms/Text";
import { Thumbnail } from "../atoms/Thumbnail";

export function AlbumRow({
  name,
  artistName,
  imageUrl,
  href,
  endContent,
}: {
  name: string;
  artistName: string;
  imageUrl?: string | null;
  href?: string;
  endContent?: ReactNode;
}) {
  return (
    <HStack gap="sm" vAlign="center">
      <Thumbnail src={imageUrl ?? undefined} label={name} alt="" />
      <StackItem size="fill">
        <Text maxLines={1}>
          {href ? (
            <Link href={href} color="primary">
              {name}
            </Link>
          ) : (
            name
          )}{" "}
          — {artistName}
        </Text>
      </StackItem>
      {endContent}
    </HStack>
  );
}
