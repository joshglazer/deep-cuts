import { SiGithub } from "react-icons/si";
import { auth } from "@/auth";
import { Text } from "@/design/atoms/Text";
import { Link } from "@/design/atoms/Link";
import { HStack } from "@/design/atoms/Stack";

export async function Footer() {
  const session = await auth();

  return (
    <footer>
      {session?.spotifyUserId && (
        <Text
          type="supporting"
          size="sm"
          display="block"
          justify="center"
          className="px-6 pt-4"
        >
          Listening activity may be delayed up to 15 minutes.
        </Text>
      )}
      <div className="flex items-center justify-between border-t border-border px-6 py-4">
        <Text type="supporting" size="sm">
          A{" "}
          <Link
            href="https://joshglazer.com"
            target="_blank"
            type="inherit"
            color="inherit"
          >
            Josh Glazer
          </Link>{" "}
          project
        </Text>
        <HStack gap="sm" vAlign="center">
          <SiGithub className="h-3 w-3 shrink-0 fill-current text-secondary" />
          <Link
            href="https://github.com/joshglazer/deep-cuts"
            target="_blank"
            isStandalone
            type="supporting"
            size="sm"
            hasUnderline={false}
            color="secondary"
          >
            Source Code
          </Link>
        </HStack>
      </div>
    </footer>
  );
}
