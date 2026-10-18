"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { SitePhoto, TILE_SIZES } from "@/components/SitePhoto";
import { VILLA_PHOTO_GROUPS, type VillaPhoto, type VillaPhotoGroup } from "@/lib/photos";

export function PhotoGallery({
  photos,
  groups = VILLA_PHOTO_GROUPS,
}: {
  photos: readonly VillaPhoto[];
  groups?: readonly { id: VillaPhotoGroup; title: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const open = openIndex !== null ? photos[openIndex] : null;

  const close = useCallback(() => {
    setOpenIndex(null);
  }, []);

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) => {
        if (current === null) return current;
        return (current + delta + photos.length) % photos.length;
      });
    },
    [photos.length],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <div>
      {groups.map((group) => {
        const groupPhotos = photos.filter((item) => item.group === group.id);
        if (groupPhotos.length === 0) return null;
        return (
          <section key={group.id} className="mt-10 first:mt-0" aria-labelledby={`gallery-${group.id}`}>
            <h3
              id={`gallery-${group.id}`}
              className="text-xs font-semibold tracking-[0.18em] uppercase text-muted"
            >
              {group.title}
            </h3>
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupPhotos.map((item) => {
                const index = photos.findIndex((photo) => photo.id === item.id);
                return (
                  <li key={item.id} id={`photo-${item.id}`} className="scroll-mt-24">
                    <figure>
                      <button
                        type="button"
                        className="relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black/5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                        onClick={() => setOpenIndex(index)}
                      >
                        <SitePhoto
                          photo={item}
                          sizes={TILE_SIZES}
                          fill
                          className="object-cover object-center"
                        />
                      </button>
                      <figcaption className="mt-2 text-sm text-muted">{item.caption}</figcaption>
                    </figure>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <dialog
        ref={dialogRef}
        className="photo-dialog"
        aria-labelledby={titleId}
        onClose={close}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            dialogRef.current?.close();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            step(1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            step(-1);
          }
        }}
      >
        {open ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 px-4 py-3 text-white sm:px-6">
              <p id={titleId} className="text-sm">
                {open.caption}
                <span className="ml-3 text-white/70">
                  {(openIndex ?? 0) + 1} / {photos.length}
                </span>
              </p>
              <button
                type="button"
                className="inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold text-white hover:bg-white/10"
                onClick={() => dialogRef.current?.close()}
              >
                Close
              </button>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16">
              <button
                type="button"
                className="absolute left-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-2xl text-white hover:bg-white/10 sm:left-4"
                aria-label="Previous photo"
                onClick={() => step(-1)}
              >
                ‹
              </button>
              <SitePhoto
                photo={open}
                sizes="100vw"
                priority
                className="max-h-[78vh] w-auto max-w-full h-auto object-contain"
              />
              <button
                type="button"
                className="absolute right-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-2xl text-white hover:bg-white/10 sm:right-4"
                aria-label="Next photo"
                onClick={() => step(1)}
              >
                ›
              </button>
            </div>
            <p className="px-6 py-4 text-center text-sm leading-6 text-white/80">{open.alt}</p>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
