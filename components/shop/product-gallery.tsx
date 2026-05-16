"use client";

import Image from "next/image";
import { useState } from "react";

type ProductGalleryProps = {
  name: string;
  images: string[];
  imageAltText?: string | null;
};

export function ProductGallery({ name, images, imageAltText }: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(images[0]);
  const baseAltText = imageAltText?.trim() || name;

  return (
    <div className="space-y-4">
      <div className="glass-panel relative aspect-square overflow-hidden rounded-[2.2rem]">
        <Image
          alt={baseAltText}
          className="h-full w-full object-cover"
          fill
          priority
          sizes="(min-width: 1024px) 40vw, 100vw"
          src={activeImage}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {images.map((image, index) => (
          <button
            className={`relative aspect-square overflow-hidden rounded-[1.3rem] border ${activeImage === image ? "border-amber-300" : "border-white/10"}`}
            key={image}
            onClick={() => setActiveImage(image)}
            type="button"
          >
            <Image
              alt={`${baseAltText} preview ${index + 1}`}
              className="h-full w-full object-cover"
              fill
              sizes="120px"
              src={image}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
