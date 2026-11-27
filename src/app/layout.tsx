import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { PhotoCredit } from "@/components/layout/PhotoCredit";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipLink } from "@/components/layout/SkipLink";
import { SkyBackground } from "@/components/layout/SkyBackground";
import { getEnv } from "@/lib/env";
import "./globals.css";

// Self-hosted (src/app/fonts, SIL OFL 1.1): no network access needed at build time.
const instrumentSerif = localFont({
  src: [
    { path: "./fonts/InstrumentSerif-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/InstrumentSerif-Italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const interTight = localFont({
  src: "./fonts/InterTight-Variable.woff2",
  weight: "400 700",
  variable: "--font-inter-tight",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
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
      <body className="group/page">
        <SkipLink />
        <SkyBackground />
        <SiteHeader />
        <main
          id="contenu"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 pt-8 pb-8 outline-none has-[[data-projection]]:max-w-[1760px] has-[[data-projection]]:pb-32 sm:px-6 sm:pt-12 sm:pb-24"
        >
          {children}
        </main>
        <PhotoCredit />
      </body>
    </html>
  );
}
