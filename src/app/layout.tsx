import type { Metadata } from "next";
import { Fraunces, Inter, Libre_Baskerville, Oswald, Science_Gothic } from "next/font/google";
import "./globals.css";
import Analytics from "@/components/site/Analytics";
import ScrollReveal from "@/components/site/ScrollReveal";
import StagingBadge from "@/components/site/StagingBadge";
import { isStagingEnv } from "@/lib/environment";
import { SiteLocaleProvider } from "@/lib/site-locale";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Used by the "Ribera" wedding template, independent of the app's own
// Fraunces/Inter identity above.
const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

// The "Ribera" template's real typeface for uppercase/eyebrow text and the
// countdown labels (Oswald above is its fallback while this loads).
const scienceGothic = Science_Gothic({
  variable: "--font-science-gothic",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  // Absolute base for the share image (src/app/opengraph-image.png) so links
  // pasted in WhatsApp, Slack, etc. get a proper preview.
  metadataBase: new URL("https://wedite.com"),
  title: "Wedite — Webs de boda que enamoran",
  description:
    "Elige un diseño de web de boda moderno, personalízalo con vuestra historia y hazlo vuestro en minutos. Sin llamadas, sin correos, todo a golpe de clic.",
  // Pre-launch: keep the whole app (including every couple's personal
  // wedding page under /preview) out of search results for now.
  robots: { index: false, follow: false },
  openGraph: { siteName: "Wedite", type: "website", locale: "es_ES" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${inter.variable} ${libreBaskerville.variable} ${oswald.variable} ${scienceGothic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <SiteLocaleProvider>{children}</SiteLocaleProvider>
        <ScrollReveal />
        <Analytics />
        {isStagingEnv() ? <StagingBadge /> : null}
      </body>
    </html>
  );
}
