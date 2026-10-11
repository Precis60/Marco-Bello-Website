import type { Metadata } from "next";

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
  { href: "/events", label: "Events" },
  { href: "/the-farm", label: "The Farm" },
] as const;

/**
 * Canonical site origin for metadata, Open Graph and JSON-LD.
 * Set NEXT_PUBLIC_SITE_URL to the production domain (Vercel). Preview
 * deployments fall back to Vercel's production URL, then localhost.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    const host = production.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}

export function pageMeta(input: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title: { absolute: input.title },
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      title: input.title,
      description: input.description,
      url: input.path,
      siteName: BRAND,
      type: "website",
      locale: "en_AU",
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
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
