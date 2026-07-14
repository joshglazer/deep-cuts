import { SiGithub } from "react-icons/si";
import { Text } from "@/design/atoms/Text";
import { Link } from "@/design/atoms/Link";
import { HStack } from "@/design/atoms/Stack";

export function Footer() {
  return (
    <footer className="flex items-center justify-between border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
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
        <SiGithub className="h-4 w-4 shrink-0 fill-current text-zinc-500 dark:text-zinc-400" />
        <Link
          href="https://github.com/joshglazer/deep-cuts"
          target="_blank"
          isStandalone
          hasUnderline={false}
          color="secondary"
        >
          Source Code
        </Link>
      </HStack>
    </footer>
  );
}
