import { Logo } from "./Logo";
import { Link } from "@/design/atoms/Link";
import { Text } from "@/design/atoms/Text";
import { HStack } from "@/design/atoms/Stack";

const SIZES = {
  sm: { logo: "h-9 w-9", text: "text-2xl" },
  lg: { logo: "h-14 w-14", text: "text-4xl" },
} as const;

interface WordmarkProps {
  size?: keyof typeof SIZES;
  href?: string;
}

export function Wordmark({ size = "sm", href }: Readonly<WordmarkProps>) {
  const { logo, text } = SIZES[size];

  return (
    <HStack gap="sm" vAlign="center">
      <Logo className={logo} />
      {href ? (
        <Link
          href={href}
          isStandalone
          hasUnderline={false}
          weight="bold"
          color="primary"
          type="inherit"
          className={`${text} tracking-tight no-underline hover:no-underline`}
        >
          Deep Cuts
        </Link>
      ) : (
        <Text weight="bold" className={text}>
          Deep Cuts
        </Text>
      )}
    </HStack>
  );
}
