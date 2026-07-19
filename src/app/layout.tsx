import type { Metadata, Viewport } from "next";
import { DesignProvider } from "@/design/DesignProvider";
import { Footer } from "@/components/Footer";
import "./globals.css";

const description =
  "Add artists and albums to your list, then see when you actually got around to listening to them.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL ?? "http://127.0.0.1:3000"),
  title: {
    default: "Deep Cuts",
    template: "%s · Deep Cuts",
  },
  description,
  openGraph: {
    title: "Deep Cuts",
    description,
    siteName: "Deep Cuts",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deep Cuts",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#141414",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <DesignProvider>
          <div className="flex-1">{children}</div>
          <Footer />
        </DesignProvider>
      </body>
    </html>
  );
}
