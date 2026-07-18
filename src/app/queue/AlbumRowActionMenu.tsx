"use client";

import { useRouter } from "next/navigation";
import { LuEllipsisVertical, LuListChecks, LuPlay, LuPlus, LuTrash2, LuUser } from "react-icons/lu";
import { Icon } from "@/design/atoms/Icon";
import { MoreMenu } from "@/design/atoms/MoreMenu";
import { useImperativeAlertDialog } from "@/design/atoms/AlertDialog";
import { removeAlbum } from "./actions";

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
            label: "Remove",
            icon: LuTrash2,
            onClick: () =>
              removeDialog.show({
                title: "Remove from queue?",
                description: `Remove "${albumName}" by ${artistName} from your queue?`,
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
    </>
  );
}
