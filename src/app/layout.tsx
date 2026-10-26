import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Lexend_Deca, Unbounded } from "next/font/google";
import SplashScreen from "@/components/SplashScreen";
import { SITE } from "@/lib/config";
import "./globals.css";

const lexend = Lexend_Deca({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-lexend", display: "swap" });
const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700", "800"], style: ["normal", "italic"], variable: "--font-barlow", display: "swap" });
// stand-in for Monument Extended until its licensed font files are added (spec §14)
const unbounded = Unbounded({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--font-unbounded", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Smash Corner · Tennis & Pickleball Courts in Quezon City", template: "%s · Smash Corner" },
  description: "Book tennis and pickleball courts in Quezon City. Open daily 7 AM – 10 PM. Rent equipment, join classes and events.",
  openGraph: { type: "website", siteName: "Smash Corner", locale: "en_PH" },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = { themeColor: "#000000", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lexend.variable} ${barlow.variable} ${unbounded.variable}`}>
      <body>
        {/* plays on every load / refresh, skippable (spec §4) */}
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
