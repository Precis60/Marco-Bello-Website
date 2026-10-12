import { getImageProps } from "next/image";

import type { VillaPhoto } from "@/lib/photos";

const BAND_SIZES = "(min-width: 1152px) 1088px, calc(100vw - 3rem)";

/**
 * Full-width bay sunset. Photo 23 fills the band from 640px up.
 * Photo 25 is the portrait frame below that, so the mobile crop stays upright.
 */
export function SunsetBand({
  desktop,
  mobile,
}: {
  desktop: VillaPhoto;
  mobile: VillaPhoto;
}) {
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({
    alt: desktop.alt,
    src: desktop.src,
    width: desktop.width,
    height: desktop.height,
    sizes: BAND_SIZES,
  });
  const { props: mobileProps } = getImageProps({
    alt: desktop.alt,
    src: mobile.src,
    width: mobile.width,
    height: mobile.height,
    sizes: BAND_SIZES,
  });

  return (
    <figure>
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl sm:aspect-[4/3]">
        <picture className="absolute inset-0 block">
          <source media="(min-width: 640px)" srcSet={desktopSrcSet} />
          <img
            {...mobileProps}
            alt={desktop.alt}
            className="h-full w-full object-cover"
            style={undefined}
          />
        </picture>
      </div>
      <figcaption className="mt-2 text-sm text-muted">{desktop.caption}</figcaption>
    </figure>
  );
}
