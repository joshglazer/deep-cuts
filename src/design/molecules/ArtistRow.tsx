import { HStack, StackItem } from "../atoms/Stack";
import { Link } from "../atoms/Link";
import { Text } from "../atoms/Text";
import { Thumbnail } from "../atoms/Thumbnail";

interface ArtistRowProps {
  name: string;
  imageUrl?: string | null;
  albumCount?: number;
  href: string;
}

export function ArtistRow({ name, imageUrl, albumCount, href }: Readonly<ArtistRowProps>) {
  return (
    <HStack gap="sm" vAlign="center" className="bg-surface rounded-lg p-2">
      <Thumbnail
        src={imageUrl ?? undefined}
        label={name}
        alt=""
        className="w-22 h-22 rounded-full [&_div]:rounded-full [&_img]:rounded-full"
      />
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
