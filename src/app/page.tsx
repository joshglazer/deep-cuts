import { redirect } from "next/navigation";
import { auth, previewLoginEnabled, signIn } from "@/auth";
import { Button } from "@/design/atoms/Button";
import { Heading } from "@/design/atoms/Heading";
import { Text } from "@/design/atoms/Text";
import { VStack } from "@/design/atoms/Stack";
import { SiSpotify } from "react-icons/si";

export default async function Home() {
  const session = await auth();
  if (session?.spotifyUserId) {
    redirect("/queue");
  }

  return (
    <VStack gap="lg" hAlign="center" vAlign="center" height="100vh">
      <Heading level={1}>Deep Cuts</Heading>
      <Text type="supporting" justify="center" className="max-w-md">
        Queue up artists and albums, then see when you actually got around to
        listening to them.
      </Text>

      <VStack gap="sm" hAlign="center">
        <form
          action={async () => {
            "use server";
            await signIn("spotify");
          }}
        >
          <Button
            type="submit"
            variant="primary"
            label="Sign in with Spotify"
            icon={<SiSpotify className="h-5 w-5 shrink-0 fill-current" />}
            className="rounded-full"
          />
        </form>
        {previewLoginEnabled && (
          <form
            action={async () => {
              "use server";
              await signIn("preview");
            }}
          >
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              label="Preview sign-in (no Spotify)"
            />
          </form>
        )}
      </VStack>
    </VStack>
  );
}
