import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AudioProvider } from "@/providers/AudioProvider";
import { AuthCodeHandler } from "@/components/AuthCodeHandler";
import { BottomNav } from "@/components/BottomNav";

/**
 * Script to prevent FOUC (Flash of Unstyled Content)
 * Runs immediately before React hydrates to set the theme
 */
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('ezviet_theme_prefs');
    var prefs = stored ? JSON.parse(stored) : { mode: 'system' };
    var theme = prefs.mode;

    if (theme === 'system' || !theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', theme);
    if (prefs.style && prefs.style !== 'default') {
      document.documentElement.setAttribute('data-style', prefs.style);
    }
  } catch (e) {}
})();
`;

const siteConfig = {
  name: "EZViet",
  title: "EZViet - Learn Vietnamese the Fun Way",
  description: "Master Vietnamese naturally with flashcards, music, and cultural immersion. Start your journey today!",
  url: "https://ezviet.com",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EZViet - Learn Vietnamese the Fun Way",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          FOUC Prevention Script - Safe: Static string defined in code, not user input.
          Must run before React hydrates to apply correct theme immediately.
        */}
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
          suppressHydrationWarning
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <AudioProvider>
              {/* Catches OAuth codes that land on wrong pages and redirects to callback */}
              <Suspense fallback={null}>
                <AuthCodeHandler />
              </Suspense>
              {/* Main content with bottom padding for mobile nav */}
              <div className="pb-16 sm:pb-0">
                {children}
              </div>
              <BottomNav />
            </AudioProvider>
          </AuthProvider>
        </ThemeProvider>
        <footer className="hidden sm:block py-6 text-center">
          <a
            href="https://goldenfocus.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-neutral-400 hover:text-neutral-500 transition-colors"
            suppressHydrationWarning
          >
            © {new Date().getFullYear()} goldenfocus.io
          </a>
        </footer>
      </body>
    </html>
  );
}
