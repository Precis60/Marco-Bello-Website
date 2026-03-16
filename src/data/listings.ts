export interface Listing {
  id: string;
  name: string;
  description: string;
  price?: string;
  availability?: string;
}

export interface Category {
  title: string;
  description: string;
  listings: Listing[];
}

export const farmSalesData: Category[] = [
  {
    title: "Honey, Wine & Olive Oil",
    description: "Artisanal products from our farm",
    listings: [
      {
        id: "honey-raw",
        name: "Raw Honey",
        description: "Pure, unfiltered honey from our hives",
        price: "$25 per 500g jar",
        availability: "Available year-round",
      },
      {
        id: "olive-oil",
        name: "Extra Virgin Olive Oil",
        description: "Cold-pressed from our estate olives",
        price: "$35 per 750ml bottle",
        availability: "Seasonal - limited stock",
      },
      {
        id: "wine",
        name: "Estate Wine",
        description: "Small batch wines from our vineyard",
        price: "From $40 per bottle",
        availability: "Contact for current vintages",
      },
    ],
  },
  {
    title: "Produce",
    description: "Fresh seasonal produce from our farm",
    listings: [
      {
        id: "produce-1",
        name: "Seasonal Vegetables",
        description: "Fresh, organic vegetables grown on-site",
        price: "Varies by season",
        availability: "Spring through Autumn",
      },
      {
        id: "produce-2",
        name: "Fresh Herbs",
        description: "Culinary herbs and medicinal plants",
        price: "$5-$10 per bunch",
        availability: "Available year-round",
      },
      {
        id: "produce-3",
        name: "Orchard Fruit",
        description: "Seasonal fruit from our orchard",
        price: "Market pricing",
        availability: "Summer and Autumn",
      },
    ],
  },
  {
    title: "Trees",
    description: "Nursery-grown trees and plants",
    listings: [
      {
        id: "olive-saplings",
        name: "Olive Saplings",
        description: "2-year-old olive trees, various cultivars",
        price: "$45 each",
        availability: "Limited stock",
      },
      {
        id: "citrus-trees",
        name: "Citrus Trees",
        description: "Lemon, orange, and lime trees",
        price: "$60-$80 depending on size",
        availability: "Spring planting season",
      },
      {
        id: "native-plants",
        name: "Native Plants",
        description: "Indigenous species for local gardens",
        price: "$15-$35 per plant",
        availability: "Available year-round",
      },
    ],
  },
];
