import { HStack, StackItem } from "../atoms/Stack";
import { Link } from "../atoms/Link";
import { Text } from "../atoms/Text";
import { Thumbnail } from "../atoms/Thumbnail";

export function ArtistRow({
  name,
  imageUrl,
  albumCount,
  href,
}: {
  name: string;
  imageUrl?: string | null;
  albumCount?: number;
  href: string;
}) {
  return (
    <HStack gap="sm" vAlign="center">
      <Thumbnail src={imageUrl ?? undefined} label={name} alt="" />
      <StackItem size="fill">
        <Link href={href} isStandalone color="primary">
          {name}
        </Link>
      </StackItem>
      {albumCount !== undefined && (
        <Text type="supporting">
          {albumCount} {albumCount === 1 ? "album" : "albums"}
        </Text>
      )}
    </HStack>
  );
}
