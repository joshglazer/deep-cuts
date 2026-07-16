import { auth, signOut } from "@/auth";
import { Logo } from "./Logo";
import { Button } from "@/design/atoms/Button";
import { Link } from "@/design/atoms/Link";
import { HStack } from "@/design/atoms/Stack";
import { HeaderMobileMenu } from "@/design/molecules/HeaderMobileMenu";
import { UserMenu } from "@/design/molecules/UserMenu";

export async function Header() {
  const session = await auth();

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <HStack gap="sm" vAlign="center">
        <div className="sm:hidden">
          <HeaderMobileMenu />
        </div>
        <Logo />
        <Link
          href="/queue"
          isStandalone
          hasUnderline={false}
          weight="bold"
          color="primary"
          type="inherit"
          className="text-2xl tracking-tight no-underline hover:no-underline"
        >
          Deep Cuts
        </Link>
      </HStack>
      <HStack gap="lg" vAlign="center">
        <HStack gap="lg" vAlign="center" className="hidden sm:flex">
          <Link href="/queue" isStandalone hasUnderline={false} color="primary">
            My Queue
          </Link>
          <Button href="/queue/search" size="sm" label="Add to Queue" />
        </HStack>
        <UserMenu
          name={session?.user?.name}
          image={session?.user?.image}
          onSignOut={async () => {
            "use server";
            await signOut();
          }}
        />
      </HStack>
    </header>
  );
}
