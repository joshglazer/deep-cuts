"use client";

import { useRouter } from "next/navigation";
import {
  LuEllipsisVertical,
  LuListChecks,
  LuPlay,
  LuPlus,
  LuRotateCcw,
  LuTrash2,
  LuUser,
} from "react-icons/lu";
import type { Schema } from "../../../amplify/data/resource";
import { spotifyAlbumUri } from "@/lib/spotifyLinks";
import { Icon } from "@/design/atoms/Icon";
import { MoreMenu } from "@/design/atoms/MoreMenu";
import { useImperativeAlertDialog } from "@/design/atoms/AlertDialog";
import { removeAlbum, resetAlbumProgress } from "./actions";
import { albumHref, artistListHref, artistSearchHref } from "./routes";

interface AlbumRowActionMenuProps {
  album: Pick<
    Schema["Album"]["type"],
    "id" | "name" | "artistName" | "spotifyAlbumId" | "spotifyArtistId"
  >;
}

export function AlbumRowActionMenu({ album }: Readonly<AlbumRowActionMenuProps>) {
  const { id, name, artistName, spotifyAlbumId, spotifyArtistId } = album;
  const router = useRouter();
  const removeDialog = useImperativeAlertDialog();
  const resetDialog = useImperativeAlertDialog();

  return (
    <>
      <MoreMenu
        label={`${name} actions`}
        icon={<Icon icon={LuEllipsisVertical} size="sm" />}
        items={[
          {
            label: "Play",
            icon: LuPlay,
            onClick: () => window.open(spotifyAlbumUri(spotifyAlbumId), "_blank"),
          },
          {
            label: "Progress",
            icon: LuListChecks,
            onClick: () => router.push(albumHref(spotifyAlbumId)),
          },
          {
            label: "Artist Albums",
            icon: LuUser,
            onClick: () => router.push(artistListHref(spotifyArtistId)),
          },
          {
            label: "Add More",
            icon: LuPlus,
            onClick: () => router.push(artistSearchHref(spotifyArtistId)),
          },
          { type: "divider" },
          {
            label: "Reset Progress",
            icon: LuRotateCcw,
            onClick: () =>
              resetDialog.show({
                title: "Reset progress?",
                description: `Mark every track on "${name}" by ${artistName} as unplayed?`,
                actionLabel: "Reset",
                onAction: async () => {
                  await resetAlbumProgress(id);
                  resetDialog.hide();
                },
              }),
          },
          {
            label: "Remove",
            icon: LuTrash2,
            onClick: () =>
              removeDialog.show({
                title: "Remove from list?",
                description: `Remove "${name}" by ${artistName} from your list?`,
                actionLabel: "Remove",
                onAction: async () => {
                  await removeAlbum(id);
                  removeDialog.hide();
                },
              }),
          },
        ]}
      />
      {removeDialog.element}
      {resetDialog.element}
    </>
  );
}
