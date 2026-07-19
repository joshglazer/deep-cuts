"use client";

import { LuRotateCcw } from "react-icons/lu";
import { Icon } from "@/design/atoms/Icon";
import { IconButton } from "@/design/atoms/IconButton";
import { useImperativeAlertDialog } from "@/design/atoms/AlertDialog";
import { resetTrackProgress } from "@/app/list/actions";

interface TrackResetButtonProps {
  spotifyAlbumId: string;
  spotifyTrackId: string;
  trackName: string;
}

export function TrackResetButton({
  spotifyAlbumId,
  spotifyTrackId,
  trackName,
}: Readonly<TrackResetButtonProps>) {
  const resetDialog = useImperativeAlertDialog();

  return (
    <>
      <IconButton
        icon={<Icon icon={LuRotateCcw} size="sm" />}
        label={`Reset progress for ${trackName}`}
        tooltip="Reset progress"
        variant="ghost"
        size="sm"
        onClick={() =>
          resetDialog.show({
            title: "Reset progress?",
            description: `Mark "${trackName}" as unplayed?`,
            actionLabel: "Reset",
            onAction: async () => {
              await resetTrackProgress(spotifyAlbumId, spotifyTrackId);
              resetDialog.hide();
            },
          })
        }
      />
      {resetDialog.element}
    </>
  );
}
