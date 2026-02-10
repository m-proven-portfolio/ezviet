import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Karaoke Hero - Learn Vietnamese Through Music",
  description:
    "Vietnamese songs with real-time synced lyrics. Sing along, follow the words, and pick up the language naturally. The most musical way to learn!",
  openGraph: {
    title: "🎤 Karaoke Hero | Vietnamese Songs with Lyrics",
    description:
      "Forget textbooks. Learn Vietnamese through music! Real-time synced lyrics, curated Vietnamese songs, and a vibe that makes learning feel like fun.",
    url: "https://ezviet.org/karaoke",
    type: "website",
    images: [
      {
        url: "https://ezviet.org/karaoke/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Karaoke Hero - Vietnamese Songs with Synced Lyrics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "🎤 Karaoke Hero | Vietnamese Songs with Lyrics",
    description:
      "Vietnamese songs + real-time lyrics = the most fun way to learn. Sing along and pick up the language naturally 🇻🇳",
    images: ["https://ezviet.org/karaoke/opengraph-image"],
  },
};

export default function KaraokeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
