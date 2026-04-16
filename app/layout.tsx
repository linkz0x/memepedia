import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://memepedia.meme";
const siteDescription =
  "An interactive bubble map visualizing the history of meme coins, characters, moments, and memes.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Memepedia — The Wikipedia of Meme Coins",
    template: "%s — Memepedia",
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Memepedia",
    title: "Memepedia — The Wikipedia of Meme Coins",
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    title: "Memepedia — The Wikipedia of Meme Coins",
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
