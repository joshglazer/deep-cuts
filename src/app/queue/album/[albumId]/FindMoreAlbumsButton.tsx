import { AddIconButton } from "@/design/molecules/AddIconButton";

export function FindMoreAlbumsButton({
  artistId,
  artistName,
}: {
  artistId: string;
  artistName: string;
}) {
  return (
    <AddIconButton
      label={`Find more albums by ${artistName}`}
      href={`/queue/search/artist/${artistId}`}
    />
  );
}
