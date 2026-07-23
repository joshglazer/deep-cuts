"use client";

import { Button } from "@/design/atoms/Button";
import { useImperativeAlertDialog } from "@/design/atoms/AlertDialog";
import { deleteAccount } from "./actions";

export function DeleteAccountButton() {
  const deleteAccountDialog = useImperativeAlertDialog();

  return (
    <>
      <Button
        variant="destructive"
        label="Delete account"
        onClick={() =>
          deleteAccountDialog.show({
            title: "Delete your account?",
            description:
              "This permanently deletes your list, listening history, and Spotify connection from Deep Cuts, and signs you out. This cannot be undone.",
            actionLabel: "Delete account",
            onAction: async () => {
              await deleteAccount();
              deleteAccountDialog.hide();
            },
          })
        }
      />
      {deleteAccountDialog.element}
    </>
  );
}
