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
    name: "The Main House",
    blurb: "A considered, high-comfort stay with sweeping views.",
    nightlyPrice: 250,
    minNights: 2,
  },
  "vineyard-tiny-home": {
    id: "vineyard-tiny-home",
    name: "Vineyard - Tiny Home",
    blurb: "Quiet, warm interiors with an orchard outlook.",
    nightlyPrice: 150,
    minNights: 2,
  },
};

export function getProperty(propertyId: string): Property | undefined {
  return properties[propertyId];
}
