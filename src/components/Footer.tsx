import { SiGithub } from "react-icons/si";
import { Text } from "@/design/atoms/Text";
import { Link } from "@/design/atoms/Link";
import { HStack } from "@/design/atoms/Stack";

export function Footer() {
  return (
    <footer className="flex flex-col gap-2 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <div className="flex items-center justify-between">
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
          <SiGithub className="h-3 w-3 shrink-0 fill-current text-zinc-500 dark:text-zinc-400" />
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
      <Text type="supporting" size="sm">
        Listening activity may be delayed up to 15 minutes.
      </Text>
    </footer>
  );
}
