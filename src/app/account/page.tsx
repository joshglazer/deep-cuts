import { auth, requireSpotifyUserIdOrRedirect } from "@/auth";
import { PageShell } from "@/components/PageShell";
import { Avatar } from "@/design/atoms/Avatar";
import { Card } from "@/design/atoms/Card";
import { Divider } from "@/design/atoms/Divider";
import { Heading } from "@/design/atoms/Heading";
import { Text } from "@/design/atoms/Text";
import { HStack, VStack } from "@/design/atoms/Stack";
import { DeleteAccountButton } from "./DeleteAccountButton";

export default async function AccountPage() {
  await requireSpotifyUserIdOrRedirect();
  const session = await auth();
  const user = session?.user;

  return (
    <PageShell title="My Account">
      <VStack gap="lg">
        <HStack gap="md" vAlign="center">
          <Avatar
            src={user?.image ?? undefined}
            name={user?.name ?? undefined}
            size="large"
          />
          <VStack gap="sm">
            <Text type="large">{user?.name ?? "Spotify user"}</Text>
            {user?.email && <Text color="secondary">{user.email}</Text>}
          </VStack>
        </HStack>

        <Divider />

        <VStack gap="sm">
          <Heading level={2}>Danger Zone</Heading>
          <Card variant="red" padding={4}>
            <VStack gap="md">
              <Text>
                Deleting your account permanently removes your list,
                listening history, and Spotify connection from Deep Cuts.
                This cannot be undone.
              </Text>
              <DeleteAccountButton />
            </VStack>
          </Card>
        </VStack>
      </VStack>
    </PageShell>
  );
}
