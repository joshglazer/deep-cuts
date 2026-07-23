import { auth, signOut } from "@/auth";
import { Wordmark } from "./Wordmark";
import { Button } from "@/design/atoms/Button";
import { Link } from "@/design/atoms/Link";
import { HStack } from "@/design/atoms/Stack";
import { HeaderMobileMenu } from "@/design/molecules/HeaderMobileMenu";
import { UserMenu } from "@/design/molecules/UserMenu";

export async function Header() {
  const session = await auth();

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <HStack gap="sm" vAlign="center">
        <div className="sm:hidden">
          <HeaderMobileMenu brand={<Wordmark />} />
        </div>
        <Wordmark href="/list" />
      </HStack>
      <HStack gap="lg" vAlign="center">
        <HStack gap="lg" vAlign="center" className="hidden sm:flex">
          <Link href="/list" isStandalone hasUnderline={false} color="primary">
            My List
          </Link>
          <Link href="/activity" isStandalone hasUnderline={false} color="primary">
            Activity
          </Link>
          <Button href="/list/search" size="sm" label="Add to List" />
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
