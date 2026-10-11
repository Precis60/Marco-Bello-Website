export interface PricedOffer {
  id: string;
  name: string;
  detail: string;
  fromPrice: number | null;
  priceLabel: string;
}

export const PANTRY_RULES = {
  cutoff:
    "Order at least 72 hours before check-in. Christmas, New Year, long weekends and hampers need 5 days.",
  minimum: 60,
  stockingFee: 25,
  stockingWaivedOver: 400,
} as const;

export const PANTRY_GROUPS: { title: string; items: PricedOffer[] }[] = [
  {
    title: "Hampers",
    items: [
      {
        id: "hamper",
        name: "Welcome or celebration hamper",
        detail:
          "Food only: local produce, packed before you arrive. Indicative range $95–$180. The stay's welcome gift is estate olive oil, separate from this hamper.",
        fromPrice: 95,
        priceLabel: "From $95",
      },
    ],
  },
  {
    title: "Packs",
    items: [
      {
        id: "breakfast-for-8",
        name: "Breakfast for 8",
        detail:
          "A breakfast pack for eight. Indicative, in the $120–$200 breakfast range. Tell us which morning you want it.",
        fromPrice: 120,
        priceLabel: "From $120",
      },
      {
        id: "bbq-night",
        name: "BBQ night",
        detail: "A BBQ pack for the house kitchen. Indicative, in the $150–$300 range.",
        fromPrice: 150,
        priceLabel: "From $150",
      },
    ],
  },
  {
    title: "Local produce",
    items: [
      {
        id: "mussels",
        name: "Portarlington mussels",
        detail: "Ordered through a licensed supplier and stocked in the fridge. Price confirmed with your request.",
        fromPrice: null,
        priceLabel: "Price on request",
      },
      {
        id: "cheese",
        name: "Cheese",
        detail: "Local cheese. Price confirmed with your request.",
        fromPrice: null,
        priceLabel: "Price on request",
      },
      {
        id: "charcuterie",
        name: "Charcuterie",
        detail: "Local charcuterie. Price confirmed with your request.",
        fromPrice: null,
        priceLabel: "Price on request",
      },
      {
        id: "bakery",
        name: "Bakery",
        detail: "Bread and pastry from a local bakery. Price confirmed with your request.",
        fromPrice: null,
        priceLabel: "Price on request",
      },
      {
        id: "olive-oil",
        name: "Estate olive oil",
        detail:
          "Extra estate olive oil for the kitchen. The welcome gift with the stay is already estate olive oil. Price confirmed with your request.",
        fromPrice: null,
        priceLabel: "Price on request",
      },
      {
        id: "honey",
        name: "Honey",
        detail: "Local honey. Price confirmed with your request.",
        fromPrice: null,
        priceLabel: "Price on request",
      },
      {
        id: "coffee",
        name: "Coffee",
        detail: "Coffee for the stay. Price confirmed with your request.",
        fromPrice: null,
        priceLabel: "Price on request",
      },
    ],
  },
];

export const CHEF_MENUS: PricedOffer[] = [
  {
    id: "farmhouse-feast",
    name: "Farmhouse Feast",
    detail:
      "A private chef dinner with local staff. Minimum spend $900. Drinks are BYO, or you order and pay a licensed retailer.",
    fromPrice: 110,
    priceLabel: "From $110 a person",
  },
  {
    id: "signature-dinner",
    name: "Signature Dinner",
    detail:
      "A longer private chef dinner. Minimum spend $1,200. Drinks are BYO, or you order and pay a licensed retailer.",
    fromPrice: 150,
    priceLabel: "From $150 a person",
  },
  {
    id: "bellarine-degustation",
    name: "Bellarine Degustation",
    detail:
      "A degustation dinner cooked for your group. Minimum spend $1,600. Drinks are BYO, or you order and pay a licensed retailer.",
    fromPrice: 200,
    priceLabel: "From $200 a person",
  },
  {
    id: "brunch",
    name: "Brunch",
    detail:
      "A private chef brunch. Minimum spend $450. Drinks are BYO, or you order and pay a licensed retailer.",
    fromPrice: 55,
    priceLabel: "From $55 a person",
  },
];

export const SERVICE_OFFERS: PricedOffer[] = [
  {
    id: "waitstaff-weekday",
    name: "Waitstaff, weekday",
    detail: "Local waitstaff. Four-hour minimum. Booked separately from the stay.",
    fromPrice: 75,
    priceLabel: "From $75 an hour",
  },
  {
    id: "waitstaff-weekend",
    name: "Waitstaff, weekend",
    detail: "Local waitstaff. Four-hour minimum. Booked separately from the stay.",
    fromPrice: 85,
    priceLabel: "From $85 an hour",
  },
  {
    id: "host-weekday",
    name: "In-house host, weekday",
    detail: "A local helper on site from 12pm to 8pm. Please give 72 hours’ notice.",
    fromPrice: 480,
    priceLabel: "From $480",
  },
  {
    id: "host-saturday",
    name: "In-house host, Saturday",
    detail: "A local helper on site from 12pm to 8pm. Please give 72 hours’ notice.",
    fromPrice: 580,
    priceLabel: "From $580",
  },
  {
    id: "host-sunday",
    name: "In-house host, Sunday",
    detail: "A local helper on site from 12pm to 8pm. Please give 72 hours’ notice.",
    fromPrice: 680,
    priceLabel: "From $680",
  },
  {
    id: "host-pack",
    name: "In-house host, 3-day pack",
    detail: "Three days of in-house help, 12pm to 8pm. Please give 72 hours’ notice.",
    fromPrice: 1450,
    priceLabel: "From $1,450",
  },
];

export const OTHER_ADD_ONS: PricedOffer[] = [
  {
    id: "massage",
    name: "In-house massage",
    detail: "A mobile therapist, on request. Indicative range $150–$220 an hour per person.",
    fromPrice: 150,
    priceLabel: "From $150 an hour",
  },
  {
    id: "transfers",
    name: "Winery transfers",
    detail:
      "A driver to local cellar doors. You order and pay the retailer. The transfer is the only thing we quote.",
    fromPrice: null,
    priceLabel: "Quote on request",
  },
  {
    id: "beekeeping",
    name: "Beekeeping",
    detail: "With a hosted-hive partner, when a session is running. Indicative $150–$200 a person.",
    fromPrice: 150,
    priceLabel: "From $150 a person",
  },
  {
    id: "class",
    name: "Sourdough, pasta or pizza class",
    detail: "With a local baker or chef, on request. Indicative $150–$250 a person.",
    fromPrice: 150,
    priceLabel: "From $150 a person",
  },
  {
    id: "farm-walk",
    name: "Guided farm walk",
    detail: "A walk on the farm with a host. A self-guided wander of the guest garden is part of the stay.",
    fromPrice: 25,
    priceLabel: "From $25 a person",
  },
  {
    id: "picnic",
    name: "Sunset picnic",
    detail: "A picnic set up on the property for two. Indicative $95–$150.",
    fromPrice: 95,
    priceLabel: "From $95 a couple",
  },
  {
    id: "ebike",
    name: "E-bike hire",
    detail: "On request and subject to availability. Indicative $60–$90 a bike for the day.",
    fromPrice: 60,
    priceLabel: "From $60 a bike",
  },
  {
    id: "celebration-setup",
    name: "Celebration set-up",
    detail: "Flowers or a simple set-up for guests who are staying. Indicative $150–$450. Not a wedding service.",
    fromPrice: 150,
    priceLabel: "From $150",
  },
  {
    id: "transfer",
    name: "Ferry or airport transfer",
    detail: "A driver to the Portarlington ferry or the airport. Quoted for the trip.",
    fromPrice: null,
    priceLabel: "Quote on request",
  },
  {
    id: "early-late",
    name: "Early check-in or late check-out",
    detail: "$150 each way, only when there is no same-day turnover. Confirmed separately.",
    fromPrice: 150,
    priceLabel: "$150",
  },
];
