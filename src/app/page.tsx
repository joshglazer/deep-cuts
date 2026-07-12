import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Deep Cuts
      </h1>
      <p className="max-w-md text-center text-zinc-600 dark:text-zinc-400">
        Queue up artists and albums, then see when you actually got around to
        listening to them.
      </p>

      {session ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-center text-sm text-zinc-500">
            Signed in as {session.user?.name ?? session.spotifyUserId}
          </p>
          <Link
            href="/queue"
            className="rounded-full bg-foreground px-5 py-3 text-background"
          >
            View your queue
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button
              type="submit"
              className="text-sm text-zinc-500 underline-offset-4 hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : (
        <form
          action={async () => {
            "use server";
            await signIn("spotify");
          }}
        >
          <button
            type="submit"
            className="rounded-full bg-[#1DB954] px-5 py-3 font-medium text-black"
          >
            Connect Spotify
          </button>
        </form>
      )}
    </div>
  );
}
