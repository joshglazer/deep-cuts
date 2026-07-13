import { Auth } from "@auth/core";
import { authConfig } from "@/auth";

// Next.js's NextRequest/NextURL unconditionally rewrites any loopback
// hostname (127.0.0.1, ::1) to the literal string "localhost" — see
// REGEX_LOCALHOST_HOSTNAME in next/dist/server/web/next-url.js. That's fine
// for most routes, but Spotify requires the *literal* 127.0.0.1 for
// http:// redirect URIs (not "localhost"), and requires the redirect_uri
// used in the token exchange to exactly match the one used to start the
// OAuth flow. Since next-auth's default route handlers build the token
// request from `req.nextUrl`, running `npm run dev` and signing in via
// http://127.0.0.1:3000 fails with "invalid_grant: Invalid redirect URI" —
// the authorize step correctly used 127.0.0.1 (via a header, not
// NextRequest), but this callback route would see "localhost" instead.
// Rebuilding a plain Request from the raw Host header before handing it to
// Auth() sidesteps NextURL's rewrite entirely (a bare `URL`/`Request`
// doesn't apply it, only `NextURL` does).
function withRealHost(request: Request): Request {
  const host = request.headers.get("host");
  if (!host) return request;
  const url = new URL(request.url);
  // Setting `url.host` alone leaves a stale port in place when `host` has
  // none (WHATWG URL spec: the host setter only touches the port if the
  // input string includes one) — e.g. Amplify's SSR runtime hands us a
  // request.url of "http://localhost:3000/...", and `url.host = host` would
  // silently keep ":3000" even after swapping in the real hostname. Setting
  // hostname/port separately clears the stale port when the header has none.
  const [hostname, port] = host.split(":");
  url.hostname = hostname;
  url.port = port ?? "";
  return new Request(url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    // Node's fetch requires this whenever a body is streamed.
    ...(request.body ? { duplex: "half" as const } : {}),
  });
}

export async function GET(request: Request) {
  return Auth(withRealHost(request), authConfig);
}

export async function POST(request: Request) {
  return Auth(withRealHost(request), authConfig);
}
