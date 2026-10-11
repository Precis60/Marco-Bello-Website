export interface Property {
  id: string;
  name: string;
  blurb: string;
  nightlyPrice: number;
  minNights: number;
}

export const properties: Record<string, Property> = {
  "main-house": {
    id: "main-house",
    name: "Villa Di Marco",
    blurb:
      "The main house: 4 bedrooms, 3 bathrooms, up to 10 guests, with the pool and spa.",
    // Admin fallback when no daily price is saved. Public quotes use src/lib/rates.ts.
    nightlyPrice: 2250,
    minNights: 2,
  },
  // Internal id kept so existing bookings and blocks stay attached to this unit.
  "vineyard-tiny-home": {
    id: "vineyard-tiny-home",
    name: "La Stalla",
    blurb: "The front unit: 2 bedrooms, 1 bathroom, sleeps 6, with 3 car parks.",
    nightlyPrice: 375,
    minNights: 2,
  },
};

export function getProperty(propertyId: string): Property | undefined {
  return properties[propertyId];
}
