import "@/styles/globals.css";

import { type Metadata } from "next";
import { Unbounded, Inter } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Krunk",
  description:
    "Weekly music queues for your friends. Cross-platform. AI-powered covers.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  manifest: "/manifest.json",
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
      </head>
      <body className="font-body antialiased">
        <TRPCReactProvider>
          <ToastProvider>{children}</ToastProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
