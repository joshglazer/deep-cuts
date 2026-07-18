import { redirect } from "next/navigation";
import { auth, previewLoginEnabled, signIn } from "@/auth";
import { Logo } from "@/components/Logo";
import { Button } from "@/design/atoms/Button";
import { Divider } from "@/design/atoms/Divider";
import { Grid } from "@/design/atoms/Grid";
import { Heading } from "@/design/atoms/Heading";
import { Text } from "@/design/atoms/Text";
import { HStack, VStack } from "@/design/atoms/Stack";
import { FeatureHighlight } from "@/design/molecules/FeatureHighlight";
import { LuGauge, LuHeadphones, LuListPlus } from "react-icons/lu";
import { SiSpotify } from "react-icons/si";

const ICON_CLASS = "h-5 w-5 shrink-0 text-accent";

const FEATURES = [
  {
    icon: <LuListPlus className={ICON_CLASS} />,
    title: "Queue anything",
    description:
      "Search Spotify and add artists or albums you've been meaning to dig into — no pressure to start right away.",
  },
  {
    icon: <LuHeadphones className={ICON_CLASS} />,
    title: "Listen like normal",
    description:
      "Just play music on Spotify as you always do. Deep Cuts quietly watches your recently played history in the background.",
  },
  {
    icon: <LuGauge className={ICON_CLASS} />,
    title: "Watch your progress",
    description:
      "Every queued album gets a live progress bar, so you always know how much is left before it's complete.",
  },
];

export default async function Home() {
  const session = await auth();
  if (session?.spotifyUserId) {
    redirect("/queue");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <VStack gap="lg" hAlign="center" width="100%">
        <VStack gap="md" hAlign="center">
          <HStack gap="sm" vAlign="center">
            <Logo className="h-14 w-14" />
            <Text weight="bold" className="text-4xl">
              Deep Cuts
            </Text>
          </HStack>
          <Heading
            level={1}
            type="display-2"
            justify="center"
            textWrap="balance"
            className="text-4xl sm:text-5xl"
          >
            Finally finish the albums you queue up
          </Heading>
          <Text
            type="large"
            color="secondary"
            justify="center"
            className="max-w-md"
          >
            Queue up artists and albums, then see when you actually got around
            to listening to them.
          </Text>
        </VStack>

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

        <Divider className="w-full max-w-xs pt-4" />

        <Grid columns={{ minWidth: 200 }} gap={6} width="100%">
          {FEATURES.map((feature) => (
            <FeatureHighlight
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </Grid>
      </VStack>
    </div>
  );
}
