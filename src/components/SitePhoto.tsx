import Image from "next/image";

import type { VillaPhoto } from "@/lib/photos";

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
