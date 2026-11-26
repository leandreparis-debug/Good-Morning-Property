import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter_Tight } from "next/font/google";
import type { ReactNode } from "react";
import { PhotoCredit } from "@/components/layout/PhotoCredit";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipLink } from "@/components/layout/SkipLink";
import { SkyBackground } from "@/components/layout/SkyBackground";
import { getEnv } from "@/lib/env";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter-tight",
  display: "swap",
});

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(getEnv().NEXT_PUBLIC_APP_URL),
    title: { default: "Good Morning Property", template: "%s · Good Morning Property" },
    description: "Le point hebdomadaire de l'équipe, préparé et chronométré.",
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#B9D6F2",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${instrumentSerif.variable} ${interTight.variable}`}>
      <body>
        <SkipLink />
        <SkyBackground />
        <SiteHeader />
        <main
          id="contenu"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 pt-8 pb-32 outline-none sm:px-6 sm:pt-12 sm:pb-24"
        >
          {children}
        </main>
        <PhotoCredit />
      </body>
    </html>
  );
}
