import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSiteUrl, lodgingJsonLd } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bellarine luxury farm stay with heated pool and spa | Bello Marco Farm, Drysdale",
    template: "%s | Bello Marco Farm",
  },
  description:
    "Luxury farm stay on Murradoc Hill, Drysdale, on the Bellarine Peninsula. Villa Di Marco has a pool and spa with solar-powered heating set to your temperature, all year, included.",
  keywords: [
    "luxury farm stay Bellarine",
    "Drysdale accommodation with heated pool",
    "Bello Marco Farm",
    "Villa Di Marco",
    "La Stalla",
    "Bellarine Peninsula farm stay",
    "Murradoc Hill",
  ],
  openGraph: {
    title: "Bello Marco Farm | Luxury farm stay, Drysdale",
    description:
      "Bay and Melbourne-skyline views from the highest point on the Bellarine, with a pool and spa on solar-powered heating, all year, included.",
    type: "website",
    siteName: "Bello Marco Farm",
    locale: "en_AU",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Bello Marco Farm | Luxury farm stay, Drysdale",
    description:
      "Drysdale accommodation with a heated pool and spa on a 76-acre Bellarine farm.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh antialiased`}
      >
        <div className="flex min-h-dvh flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(lodgingJsonLd(siteUrl)).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
