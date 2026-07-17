"use client";

import { LuPlus } from "react-icons/lu";
import { Icon } from "@/design/atoms/Icon";
import { IconButton } from "@/design/atoms/IconButton";

export function FindMoreAlbumsButton({
  artistId,
  artistName,
}: {
  artistId: string;
  artistName: string;
}) {
  return (
    <IconButton
      icon={<Icon icon={LuPlus} size="sm" />}
      label={`Find more albums by ${artistName}`}
      href={`/queue/search/artist/${artistId}`}
      variant="ghost"
      size="sm"
    />
  );
}
