import type { Metadata } from "next";

import { defaultOgImage } from "@/lib/photos";

export const BRAND = "Bello Marco Farm";

export const PHONE_DISPLAY = "0413 729 663";
export const PHONE_TEL = "+61413729663";
export const EMAIL = "admin@bellomarco.com.au";

export const ADDRESS = {
  street: "275 Founds Road",
  locality: "Drysdale",
  region: "VIC",
  postalCode: "3222",
  country: "AU",
} as const;

export const ADDRESS_LINE = "275 Founds Road, Drysdale VIC 3222";

export const NAV_LINKS = [
  { href: "/villa-di-marco", label: "Villa Di Marco" },
  { href: "/la-stalla", label: "La Stalla" },
  { href: "/the-estate", label: "The Estate" },
  { href: "/experiences", label: "Experiences" },
  { href: "/pantry", label: "Pantry" },
  { href: "/cellar-doors", label: "Cellar doors" },
  { href: "/events", label: "Events" },
  { href: "/the-farm", label: "The Farm" },
] as const;

/**
 * Production origin used when no site URL is configured.
 * This is the Vercel production host, never a preview or branch URL.
 */
export const DEFAULT_PRODUCTION_SITE_URL = "https://marco-bello-website.vercel.app";

/**
 * Canonical site origin for metadata, sitemap, robots, Open Graph and JSON-LD.
 *
 * 1. NEXT_PUBLIC_SITE_URL — set this in Vercel when a custom domain is added.
 * 2. VERCEL_PROJECT_PRODUCTION_URL — the project's production host.
 * 3. https://marco-bello-website.vercel.app in production and on Vercel
 *    preview builds, so those builds never emit localhost or a branch URL.
 * 4. http://localhost:3000 for local development.
 *
 * VERCEL_URL is intentionally unused: it is the current deployment host,
 * including preview and branch URLs.
 */
export function getSiteUrl(): string {
  const explicit = normaliseOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicit) return explicit;

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    const host = production.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (host) return `https://${host}`;
  }

  if (process.env.NODE_ENV === "production" || isVercelDeployment()) {
    return DEFAULT_PRODUCTION_SITE_URL;
  }

  return "http://localhost:3000";
}

/** Absolute URL on the resolved production origin. */
export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return normalised === "/" ? `${base}/` : `${base}${normalised}`;
}

function normaliseOrigin(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/$/, "");
}

function isVercelDeployment(): boolean {
  const env = process.env.VERCEL_ENV;
  return env === "production" || env === "preview";
}

export function pageMeta(input: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = absoluteUrl(input.path);
  return {
    title: { absolute: input.title },
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: BRAND,
      type: "website",
      locale: "en_AU",
      images: [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [defaultOgImage.url],
    },
  };
}

export function lodgingJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": ["LodgingBusiness", "LocalBusiness"],
    name: BRAND,
    description:
      "Luxury farm stay on a 76-acre farm at 275 Founds Road, Drysdale, on Murradoc Hill, the highest point on the Bellarine Peninsula. Villa Di Marco has a pool and spa with solar-powered heating set to each guest's temperature for the whole stay, all year, included.",
    url: siteUrl,
    telephone: PHONE_TEL,
    email: EMAIL,
    address: {
      "@type": "PostalAddress",
      streetAddress: ADDRESS.street,
      addressLocality: ADDRESS.locality,
      addressRegion: ADDRESS.region,
      postalCode: ADDRESS.postalCode,
      addressCountry: ADDRESS.country,
    },
    checkinTime: "14:00",
    checkoutTime: "10:00",
    petsAllowed: true,
    amenityFeature: [
      {
        "@type": "LocationFeatureSpecification",
        name: "Pool with solar-powered heating",
        value: true,
      },
      {
        "@type": "LocationFeatureSpecification",
        name: "Spa with solar-powered heating",
        value: true,
      },
    ],
    containsPlace: [
      {
        "@type": "Accommodation",
        name: "Villa Di Marco",
        description:
          "Main house. 4 bedrooms, 3 full bathrooms, 8 guests in beds plus 2 single fold-out sofa beds (maximum 10), 6 car parks. Pool and spa included.",
        occupancy: { "@type": "QuantitativeValue", maxValue: 10 },
        numberOfBedrooms: 4,
        petsAllowed: true,
      },
      {
        "@type": "Accommodation",
        name: "La Stalla",
        description:
          "Existing front unit. 2 bedrooms, 1 bathroom, sleeps 6, 3 car parks. Pool and spa access only when the whole property is booked as The Estate.",
        occupancy: { "@type": "QuantitativeValue", maxValue: 6 },
        numberOfBedrooms: 2,
      },
      {
        "@type": "Accommodation",
        name: "The Estate",
        description:
          "Exclusive use of Villa Di Marco and La Stalla. Up to 16 guests. Pool and spa for the whole group.",
        occupancy: { "@type": "QuantitativeValue", maxValue: 16 },
      },
    ],
  };
}
