import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/top-bar";
import { BottomNav } from "@/components/bottom-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: "Picks Daily — Guess the NFL Player",
  description:
    "A new silhouetted NFL play every day. Watch, guess the highlighted player, build your streak.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Picks Daily",
  },
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Picks Daily — Guess the NFL Player",
    description:
      "One silhouetted NFL play every day. Spot the player in red. Build your streak.",
    type: "website",
    siteName: "Picks Daily",
  },
  twitter: {
    card: "summary_large_image",
    title: "Picks Daily — Guess the NFL Player",
    description:
      "One silhouetted NFL play every day. Spot the player in red. Build your streak.",
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-dvh flex flex-col bg-background text-foreground">
        <TopBar />
        <main className="flex-1 mx-auto w-full max-w-md px-4 pb-28 pt-2">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
