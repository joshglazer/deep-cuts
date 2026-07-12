import { signOut } from "@/auth";
import { Button } from "@/design/atoms/Button";
import { Link } from "@/design/atoms/Link";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <Link
        href="/queue"
        isStandalone
        hasUnderline={false}
        weight="semibold"
        color="primary"
      >
        Deep Cuts
      </Link>
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <Button type="submit" variant="ghost" size="sm" label="Sign out" />
      </form>
    </header>
  );
}
