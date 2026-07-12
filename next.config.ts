import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local Spotify OAuth requires browsing via 127.0.0.1 (see src/auth.ts and
  // the route handler under src/app/api/auth/[...nextauth]/), which Next's
  // dev server otherwise treats as a cross-origin request and blocks HMR
  // asset/websocket requests from — this just allowlists it for that.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
