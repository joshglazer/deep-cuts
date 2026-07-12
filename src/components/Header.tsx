import Link from "next/link";
import { signOut } from "@/auth";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <Link href="/queue" className="font-semibold tracking-tight">
        Deep Cuts
      </Link>
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button
          type="submit"
          className="text-sm text-zinc-500 underline-offset-4 hover:text-spotify-green hover:underline"
        >
          Sign out
        </button>
      </form>
    </header>
  );
}
