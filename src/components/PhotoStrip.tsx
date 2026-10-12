import Link from "next/link";

import { SitePhoto } from "@/components/SitePhoto";
import type { VillaPhoto } from "@/lib/photos";

const STRIP_SIZES = "(min-width: 1024px) 250px, (min-width: 640px) 33vw, 50vw";

export function PhotoStrip({
  photos,
  heading = "Inside Villa Di Marco",
}: {
  photos: readonly VillaPhoto[];
  heading?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h3 className="text-xl font-semibold tracking-tight">{heading}</h3>
        <Link href="/villa-di-marco#gallery" className="text-sm font-semibold">
          All house photos →
        </Link>
      </div>
      <ul
        className={`mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 ${
          photos.length > 6 ? "lg:grid-cols-4" : "lg:grid-cols-6"
        }`}
      >
        {photos.map((photo) => (
          <li key={photo.id}>
            <Link href={`/villa-di-marco#photo-${photo.id}`} className="group block">
              <span className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-black/5">
                <SitePhoto
                  photo={photo}
                  sizes={STRIP_SIZES}
                  fill
                  className="object-cover object-center transition duration-300 group-hover:scale-[1.02]"
                />
              </span>
              <span className="mt-2 block text-sm text-muted">{photo.caption}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
