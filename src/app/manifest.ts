import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Deep Cuts",
    short_name: "Deep Cuts",
    description:
      "Queue up artists and albums, then see when you actually got around to listening to them.",
    start_url: "/queue",
    display: "standalone",
    background_color: "#141414",
    theme_color: "#1DB954",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
