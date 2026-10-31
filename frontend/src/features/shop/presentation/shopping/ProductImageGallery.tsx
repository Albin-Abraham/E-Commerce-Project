/**
 * Shopping Presentation: Product Image Gallery
 */

import React, { useState } from "react";
import type { ProductGalleryImage } from "../../modules/products/application/read-models/product-detail.model";

export interface ProductImageGalleryProps {
  images: ProductGalleryImage[];
  title: string;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  title,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeImage = images[selectedIndex] || images[0];

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 w-full">
      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto scrollbar-none max-h-[500px]">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                selectedIndex === idx
                  ? "border-primary ring-2 ring-primary/20 shadow-xs"
                  : "border-border/60 hover:border-border opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={img.url}
                alt={img.altText || `${title} thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Preview */}
      <div className="relative flex-1 aspect-product-card md:aspect-editorial-gallery rounded-2xl overflow-hidden bg-surface border border-border flex items-center justify-center">
        {activeImage && (
          <img
            src={activeImage.url}
            alt={activeImage.altText || title}
            className="w-full h-full object-cover transition-all duration-300"
          />
        )}
      </div>
    </div>
  );
};
