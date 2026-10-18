import Image from "next/image";

import type { VillaPhoto } from "@/lib/photos";

/** Full-width feature frames: home, villa, estate, and farm heroes. */
export const HERO_SIZES = "(min-width: 1152px) 1088px, calc(100vw - 3rem)";

/** Equal tiles in a 1 / 2 / 3 column grid. */
export const TILE_SIZES = "(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw";

/**
 * One 4:3 frame for every photo in a row or used as a full-width hero.
 * object-cover crops the source; it does not stretch it.
 */
export function FramedPhoto({
  photo,
  sizes,
  priority = false,
  rounded = "rounded-3xl",
  className = "",
}: {
  photo: VillaPhoto;
  sizes: string;
  priority?: boolean;
  rounded?: string;
  className?: string;
}) {
  return (
    <div className={`relative aspect-[4/3] overflow-hidden bg-black/5 ${rounded} ${className}`}>
      <SitePhoto
        photo={photo}
        sizes={sizes}
        priority={priority}
        fill
        className="object-cover object-center"
      />
    </div>
  );
}

export function SitePhoto({
  photo,
  sizes,
  priority = false,
  className,
  fill = false,
}: {
  photo: VillaPhoto;
  sizes: string;
  priority?: boolean;
  className?: string;
  fill?: boolean;
}) {
  if (fill) {
    return (
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={className}
      />
    );
  }

  return (
    <Image
      src={photo.src}
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
