import { redirect } from "next/navigation";
import { auth, previewLoginEnabled, signIn } from "@/auth";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/design/atoms/Button";
import { Divider } from "@/design/atoms/Divider";
import { Grid } from "@/design/atoms/Grid";
import { Heading } from "@/design/atoms/Heading";
import { Text } from "@/design/atoms/Text";
import { VStack } from "@/design/atoms/Stack";
import { FeatureHighlight } from "@/design/molecules/FeatureHighlight";
import { LuGauge, LuHeadphones, LuListPlus } from "react-icons/lu";
import { SiSpotify } from "react-icons/si";

const ICON_CLASS = "h-5 w-5 shrink-0 text-accent";

const FEATURES = [
  {
    icon: <LuListPlus className={ICON_CLASS} />,
    title: "Add anything to your list",
    description:
      "Search Spotify and add albums you've been meaning to dig into — no pressure to start right away.",
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
      "Every album on your list gets a live progress bar, so you always know how much is left before it's complete.",
  },
];

export default async function Home() {
  const session = await auth();
  if (session?.spotifyUserId) {
    redirect("/list");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <VStack gap="lg" hAlign="center" width="100%">
        <VStack gap="md" hAlign="center">
          <div className="mb-4">
            <Wordmark size="lg" />
          </div>
          <Heading
            level={1}
            type="display-2"
            justify="center"
            textWrap="balance"
            className="text-xl sm:text-2xl"
          >
            Finally finish the albums you have wanted to hear
          </Heading>
          <Text
            type="large"
            color="secondary"
            justify="center"
            className="max-w-md"
          >
            Add albums to your list, then see when you actually got around to
            listening to them.
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
          {FEATURES.map((feature, index) => {
            const highlight = (
              <FeatureHighlight
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            );
            // With 3 items and columns={{ minWidth: 200 }} on this max-w-3xl
            // (768px) container with a 24px gap, the grid only has room for
            // 3 columns once the viewport hits 696px — below that it's 2
            // columns, and the last item wraps alone under the first
            // column. Center it full-width there instead; at 696px+ let it
            // sit in the grid normally. Recompute this breakpoint if
            // minWidth, gap, or the container's max width change.
            return index === FEATURES.length - 1 && FEATURES.length % 2 === 1 ? (
              <div
                key={feature.title}
                className="col-span-full mx-auto max-w-xs min-[696px]:col-span-1 min-[696px]:mx-0 min-[696px]:max-w-none"
              >
                {highlight}
              </div>
            ) : (
              <div key={feature.title}>{highlight}</div>
            );
          })}
        </Grid>
      </VStack>
    </div>
  );
}
