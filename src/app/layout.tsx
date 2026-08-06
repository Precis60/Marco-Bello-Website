import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://precis60.github.io/Marco-Bello-Website"),
  title: {
    default: "Bello Marco Farm | Luxury Rural Stays & Farm Sales",
    template: "%s | Bello Marco Farm",
  },
  description:
    "Luxury rural stays and curated farm sales on the Bellarine Peninsula — honey, wine, olive oil, produce, and plants from our Drysdale farm.",
  keywords: [
    "Bello Marco Farm",
    "Drysdale farm stay",
    "Bellarine Peninsula accommodation",
    "farm sales",
    "honey",
    "olive oil",
    "wine",
    "plants",
  ],
  openGraph: {
    title: "Bello Marco Farm",
    description:
      "Luxury rural stays and curated farm sales on the Bellarine Peninsula.",
    type: "website",
    siteName: "Bello Marco Farm",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bello Marco Farm",
    description:
      "Luxury rural stays and curated farm sales on the Bellarine Peninsula.",
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
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Bello Marco Farm",
              description:
                "Luxury rural stays and curated farm sales on the Bellarine Peninsula.",
              url: "https://precis60.github.io/Marco-Bello-Website",
              telephone: "+61-413-729-663",
              email: "admin@bellomarco.com.au",
              address: {
                "@type": "PostalAddress",
                streetAddress: "275 Founds Road",
                addressLocality: "Drysdale",
                addressRegion: "VIC",
                postalCode: "3222",
                addressCountry: "AU",
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
