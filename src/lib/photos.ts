/**
 * Villa Di Marco interim photos — the only image catalogue for the public site.
 *
 * To swap in professional or post-renovation photos later, replace the file in
 * `public/photos/villa-di-marco/` and update that picture's entry here
 * (src, alt, caption, width, height). Home, Villa Di Marco, The Estate, and
 * the default Open Graph image all read from this file.
 *
 * These are the owner's phone photos. Pool, spa, the house exterior,
 * the view from the hill, and La Stalla stay as placeholders until they
 * are photographed.
 */

export type VillaPhotoGroup =
  | "living"
  | "kitchen-dining"
  | "bedrooms"
  | "bathrooms"
  | "study"
  | "hallway"
  | "outdoors"
  | "farm";

export type VillaPhoto = {
  id: string;
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  group: VillaPhotoGroup;
};

export const VILLA_PHOTO_GROUPS: readonly { id: VillaPhotoGroup; title: string }[] = [
  { id: "living", title: "Living" },
  { id: "kitchen-dining", title: "Kitchen & dining" },
  { id: "bedrooms", title: "Bedrooms" },
  { id: "bathrooms", title: "Bathrooms" },
  { id: "study", title: "Study" },
  { id: "hallway", title: "Hallway" },
  { id: "outdoors", title: "Outdoors" },
  { id: "farm", title: "The farm" },
];

const photo = (
  id: string,
  file: string,
  alt: string,
  caption: string,
  width: number,
  height: number,
  group: VillaPhotoGroup,
): VillaPhoto => ({
  id,
  src: `/photos/villa-di-marco/${file}`,
  alt,
  caption,
  width,
  height,
  group,
});

export const VILLA_PHOTOS: readonly VillaPhoto[] = [
  photo(
    "01",
    "01-living-dining-wide-views.jpg",
    "Living and dining rooms at Villa Di Marco, with wide glass looking onto rural and bay views.",
    "Living and dining",
    1600,
    1200,
    "living",
  ),
  photo(
    "02",
    "02-living-room-fireplace.jpg",
    "Living room with a fireplace, sofas, and glass doors to rural views.",
    "Living room",
    1600,
    1200,
    "living",
  ),
  photo(
    "03",
    "03-living-room-glass-walls.jpg",
    "Living room with floor-to-ceiling glass and rural views.",
    "Glass walls",
    1200,
    1600,
    "living",
  ),
  photo(
    "04",
    "04-lounge-sofas-rural-view.jpg",
    "Lounge with sofas facing glass doors and rural views.",
    "Lounge",
    1200,
    1600,
    "living",
  ),
  photo(
    "05",
    "05-kitchen-dining-table.jpg",
    "Kitchen and dining table, with glass doors to rural views.",
    "Kitchen and dining",
    1600,
    1200,
    "kitchen-dining",
  ),
  photo(
    "06",
    "06-kitchen-island.jpg",
    "Kitchen island and dining area, looking toward rural views.",
    "Kitchen island",
    1200,
    1600,
    "kitchen-dining",
  ),
  photo(
    "07",
    "07-kitchen-views.jpg",
    "Kitchen with an island bench and windows onto rural views.",
    "Kitchen",
    1200,
    1600,
    "kitchen-dining",
  ),
  photo(
    "08",
    "08-dining-gum-tree-view.jpg",
    "Dining area beside a gum tree outside the glass, with rural views.",
    "Dining",
    1200,
    1600,
    "kitchen-dining",
  ),
  photo(
    "09",
    "09-main-bedroom-vineyard-view.jpg",
    "Main bedroom with glass doors to the vineyard and rural views.",
    "Main bedroom",
    1600,
    1200,
    "bedrooms",
  ),
  photo(
    "10",
    "10-main-bedroom-tv-ensuite.jpg",
    "Main bedroom with a television, a window, and the ensuite doorway.",
    "Main bedroom and ensuite",
    1200,
    1600,
    "bedrooms",
  ),
  photo(
    "11",
    "11-ensuite-vanity-window.jpg",
    "Main bedroom ensuite, with a double vanity and a window.",
    "Ensuite",
    1600,
    1200,
    "bathrooms",
  ),
  photo(
    "12",
    "12-guest-bedroom-window-view.jpg",
    "Guest bedroom with a bed facing a window and rural views.",
    "Guest bedroom",
    1600,
    1200,
    "bedrooms",
  ),
  photo(
    "13",
    "13-guest-bedroom.jpg",
    "Guest bedroom with a bed, side tables, and glass doors to rural views.",
    "Guest bedroom",
    1600,
    1200,
    "bedrooms",
  ),
  photo(
    "14",
    "14-bedroom-wardrobe-desk.jpg",
    "Bedroom with a built-in wardrobe, a desk, and a window.",
    "Bedroom",
    1600,
    1200,
    "bedrooms",
  ),
  photo(
    "15",
    "15-study-vineyard-view.jpg",
    "Study with a desk and glass doors to the vineyard and rural views.",
    "Study",
    1600,
    1200,
    "study",
  ),
  photo(
    "16",
    "16-bath-with-view.jpg",
    "Bathroom with a freestanding bath beside a window and rural views.",
    "Bath",
    1200,
    1600,
    "bathrooms",
  ),
  photo(
    "17",
    "17-bathroom-vanity-and-bath.jpg",
    "Bathroom with a vanity, mirror, and bathtub.",
    "Bathroom",
    1200,
    1600,
    "bathrooms",
  ),
  photo(
    "18",
    "18-bathroom-walk-in-shower.jpg",
    "Walk-in shower with a frameless glass screen.",
    "Shower",
    1200,
    1600,
    "bathrooms",
  ),
  photo(
    "19",
    "19-shower-gum-tree-window.jpg",
    "Shower beside a window looking onto a gum tree.",
    "Shower window",
    1200,
    1600,
    "bathrooms",
  ),
  photo(
    "20",
    "20-hallway.jpg",
    "Hallway with a built-in wardrobe and timber floor.",
    "Hallway",
    1200,
    1600,
    "hallway",
  ),
  photo(
    "21",
    "21-garden-firepit-bay-view.jpg",
    "Fire pit and benches in the Villa Di Marco garden, with gravel paths, wine-barrel planters, the vineyard, and bay views.",
    "Garden and fire pit",
    1180,
    900,
    "outdoors",
  ),
  photo(
    "22",
    "22-garden-vineyard-bay-view.jpg",
    "Vineyard rows in the new garden at Villa Di Marco, with bay views on the horizon.",
    "Vineyard and bay",
    1600,
    780,
    "outdoors",
  ),
  photo(
    "28",
    "28-farm-calves-at-gate.jpg",
    "Young calves at the paddock gate on Bello Marco Farm, with green pasture and a young vineyard behind.",
    "Calves at the gate",
    1600,
    1200,
    "farm",
  ),
];

export function villaPhoto(id: string): VillaPhoto {
  const match = VILLA_PHOTOS.find((item) => item.id === id);
  if (!match) throw new Error(`Unknown Villa Di Marco photo: ${id}`);
  return match;
}

/** Gallery order: room groups, then photo number within each group. */
export const VILLA_GALLERY: readonly VillaPhoto[] = VILLA_PHOTO_GROUPS.flatMap((group) =>
  VILLA_PHOTOS.filter((item) => item.group === group.id).sort((a, b) => a.id.localeCompare(b.id)),
);

/** Home hero and Villa Di Marco hero. */
export const VILLA_HERO = villaPhoto("01");

/** Home page "Inside Villa Di Marco" highlights, in display order. */
export const HOME_VILLA_HIGHLIGHTS: readonly VillaPhoto[] = ["01", "02", "05", "09", "16", "15", "21"].map(
  villaPhoto,
);

/** The Estate page interiors and garden. La Stalla and the pool stay as placeholders. */
export const ESTATE_PHOTOS: readonly VillaPhoto[] = ["01", "05", "08", "21"].map(villaPhoto);

/** Paddock photo. Not a claim about ownership of a herd, or that guests may feed animals. */
export const FARM_PHOTO = villaPhoto("28");

export const defaultOgImage = {
  url: VILLA_HERO.src,
  width: VILLA_HERO.width,
  height: VILLA_HERO.height,
  alt: VILLA_HERO.alt,
};
