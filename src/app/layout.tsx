import "@/styles/globals.css";

import { type Metadata } from "next";
import { Unbounded, Inter } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  metadataBase: new URL("https://getkrunk.app"),
  title: { default: "Krunk", template: "%s | Krunk" },
  description:
    "Weekly music queues for your friends. Cross-platform. AI-powered covers.",
  icons: [
    { rel: "icon", url: "/favicon.ico", sizes: "32x32" },
    { rel: "icon", url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { rel: "icon", url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
  ],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: "Krunk",
    title: "Krunk — Weekly Music Queues",
    description:
      "Weekly music queues for your friends. Cross-platform. AI-powered covers.",
    url: "https://getkrunk.app",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Krunk — weekly music queues for your friends",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Krunk — Weekly Music Queues",
    description:
      "Weekly music queues for your friends. Cross-platform. AI-powered covers.",
    images: [
      {
        url: "/og-image.png",
        alt: "Krunk — weekly music queues for your friends",
      },
    ],
  },
};

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${unbounded.variable} ${inter.variable}`}>
      <head>
        <link
          rel="preconnect"
          href="https://js-cdn.music.apple.com"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Krunk",
              url: "https://getkrunk.app",
              description:
                "Weekly music queues for your friends. Cross-platform. AI-powered covers.",
              applicationCategory: "MusicApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
      </head>
      <body className="font-body antialiased">
        <TRPCReactProvider>
          <ToastProvider>{children}</ToastProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
