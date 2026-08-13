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
    name: "The Main House - Villa Di Marco",
    blurb: "A considered, high-comfort stay with sweeping views.",
    nightlyPrice: 2250,
    minNights: 2,
  },
  "vineyard-tiny-home": {
    id: "vineyard-tiny-home",
    name: "Tiny Home - La Stalla",
    blurb: "Quiet, warm interiors with an orchard outlook.",
    nightlyPrice: 375,
    minNights: 2,
  },
};

export function getProperty(propertyId: string): Property | undefined {
  return properties[propertyId];
}
