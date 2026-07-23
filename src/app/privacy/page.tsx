import { PageShell } from "@/components/PageShell";
import { Heading } from "@/design/atoms/Heading";
import { Text } from "@/design/atoms/Text";
import { Link } from "@/design/atoms/Link";
import { VStack } from "@/design/atoms/Stack";

const CONTACT_EMAIL = "joshglazer@gmail.com";

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy">
      <VStack gap="lg">
        <Text color="secondary" size="sm">
          Effective July 21, 2026
        </Text>

        <Text>
          Deep Cuts (&ldquo;the app&rdquo;) is a personal project built and
          operated by Josh Glazer, not a company. This page explains what
          information the app collects when you use it, why, and how you can
          control or delete it.
        </Text>

        <VStack gap="sm">
          <Heading level={2}>Information we collect</Heading>
          <Text>
            When you sign in with Spotify, the app requests permission to
            access:
          </Text>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <Text as="span">
                Your Spotify email address, display name, and profile image
              </Text>
            </li>
            <li>
              <Text as="span">
                Your recently played tracks and currently playing track
              </Text>
            </li>
            <li>
              <Text as="span">Your top artists and tracks</Text>
            </li>
          </ul>
          <Text>
            The app also stores information you create by using it: the
            albums and artists you add to your list, and a history of
            individual track plays used to calculate your progress through
            each album and to build your Stats page.
          </Text>
        </VStack>

        <VStack gap="sm">
          <Heading level={2}>How we use this information</Heading>
          <Text>
            We match your Spotify listening activity against the albums on
            your list to show progress, and use your play history to build
            the Stats page (streaks, weekly/monthly trends, and the activity
            heatmap). Your Spotify user ID is the key all of this data is
            stored under.
          </Text>
          <Text>
            A background job checks your recently played tracks periodically
            (roughly every 15 minutes) even when you&rsquo;re not actively
            using the app, so your progress stays current. To support this,
            we store your Spotify refresh token &mdash; a credential that lets
            the app request a new access token on your behalf. It does not
            give the app your Spotify password, and it is never sent to your
            browser; it&rsquo;s used exclusively by server-side code.
          </Text>
        </VStack>

        <VStack gap="sm">
          <Heading level={2}>What we don&rsquo;t do</Heading>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <Text as="span">
                We don&rsquo;t sell or share your data with third parties.
              </Text>
            </li>
            <li>
              <Text as="span">
                We don&rsquo;t use your data for advertising, and the app has
                no third-party analytics or tracking scripts.
              </Text>
            </li>
            <li>
              <Text as="span">
                We don&rsquo;t post, modify, or delete anything in your
                Spotify account. Every Spotify permission the app requests is
                read-only.
              </Text>
            </li>
          </ul>
        </VStack>

        <VStack gap="sm">
          <Heading level={2}>Where data is stored</Heading>
          <Text>
            All data is stored in a private AWS database that only the
            app&rsquo;s own servers can access. Nothing in this database is
            publicly reachable.
          </Text>
        </VStack>

        <VStack gap="sm">
          <Heading level={2}>How long we keep data, and your choices</Heading>
          <Text>
            We keep your list, listen history, and profile info for as long
            as you use the app. You&rsquo;re in control of it:
          </Text>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <Text as="span">
                Removing an album from your list deletes its associated
                listen history.
              </Text>
            </li>
            <li>
              <Text as="span">
                Resetting progress on an album or a single track deletes just
                that listen history.
              </Text>
            </li>
            <li>
              <Text as="span">
                Deleting your account from the Danger Zone on the{" "}
                <Link href="/account" type="inherit" color="inherit">
                  My Account
                </Link>{" "}
                page immediately and permanently deletes your list, listening
                history, and stored refresh token, then signs you out.
              </Text>
            </li>
            <li>
              <Text as="span">
                Revoking the app&rsquo;s access from Spotify&rsquo;s{" "}
                <Link
                  href="https://www.spotify.com/account/apps/"
                  target="_blank"
                  type="inherit"
                  color="inherit"
                >
                  connected apps page
                </Link>{" "}
                immediately stops the background sync and stops the app from
                requesting new tokens, though it doesn&rsquo;t delete data
                already stored &mdash; use &ldquo;Delete account&rdquo; for
                that.
              </Text>
            </li>
          </ul>
          <Text>
            Questions about deleting your data, or trouble using the options
            above? Email{" "}
            <Link
              href={`mailto:${CONTACT_EMAIL}`}
              type="inherit"
              color="inherit"
            >
              {CONTACT_EMAIL}
            </Link>
            .
          </Text>
        </VStack>

        <VStack gap="sm">
          <Heading level={2}>Children&rsquo;s privacy</Heading>
          <Text>
            Deep Cuts is not directed at children under 13, and we don&rsquo;t
            knowingly collect information from them.
          </Text>
        </VStack>

        <VStack gap="sm">
          <Heading level={2}>Changes to this policy</Heading>
          <Text>
            If this policy changes, the effective date at the top of this
            page will be updated.
          </Text>
        </VStack>

        <VStack gap="sm">
          <Heading level={2}>Contact</Heading>
          <Text>
            Questions about this policy or your data? Email{" "}
            <Link
              href={`mailto:${CONTACT_EMAIL}`}
              type="inherit"
              color="inherit"
            >
              {CONTACT_EMAIL}
            </Link>
            .
          </Text>
        </VStack>
      </VStack>
    </PageShell>
  );
}
