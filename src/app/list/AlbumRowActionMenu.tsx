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
import { Icon } from "@/design/atoms/Icon";
import { MoreMenu } from "@/design/atoms/MoreMenu";
import { useImperativeAlertDialog } from "@/design/atoms/AlertDialog";
import { removeAlbum, resetAlbumProgress } from "./actions";

interface AlbumRowActionMenuProps {
  albumId: string;
  albumName: string;
  artistName: string;
  spotifyAlbumId: string;
  albumHref: string;
  artistHref: string;
  addMoreHref: string;
}

export function AlbumRowActionMenu({
  albumId,
  albumName,
  artistName,
  spotifyAlbumId,
  albumHref,
  artistHref,
  addMoreHref,
}: Readonly<AlbumRowActionMenuProps>) {
  const router = useRouter();
  const removeDialog = useImperativeAlertDialog();
  const resetDialog = useImperativeAlertDialog();

  return (
    <>
      <MoreMenu
        label={`${albumName} actions`}
        icon={<Icon icon={LuEllipsisVertical} size="sm" />}
        items={[
          {
            label: "Play",
            icon: LuPlay,
            onClick: () => window.open(`spotify:album:${spotifyAlbumId}`, "_blank"),
          },
          { label: "Progress", icon: LuListChecks, onClick: () => router.push(albumHref) },
          { label: "Artist Albums", icon: LuUser, onClick: () => router.push(artistHref) },
          { label: "Add More", icon: LuPlus, onClick: () => router.push(addMoreHref) },
          { type: "divider" },
          {
            label: "Reset Progress",
            icon: LuRotateCcw,
            onClick: () =>
              resetDialog.show({
                title: "Reset progress?",
                description: `Mark every track on "${albumName}" by ${artistName} as unplayed?`,
                actionLabel: "Reset",
                onAction: async () => {
                  await resetAlbumProgress(albumId);
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
                description: `Remove "${albumName}" by ${artistName} from your list?`,
                actionLabel: "Remove",
                onAction: async () => {
                  await removeAlbum(albumId);
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
