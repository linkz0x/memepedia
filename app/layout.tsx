import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memepedia — The Wikipedia of Meme Coins",
  description:
    "An interactive bubble map visualizing the history of meme coins, characters, moments, and memes.",
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
