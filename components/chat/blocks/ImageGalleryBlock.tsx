"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageGalleryBlockProps {
  title?: string;
  images: string[];
}

export function ImageGalleryBlock({
  title,
  images,
}: ImageGalleryBlockProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">ဓာတ်ပုံများ မရှိပါ</p>
    );
  }

  const goNext = () => {
    if (lightboxIndex == null) return;
    setLightboxIndex((lightboxIndex + 1) % images.length);
  };

  const goPrev = () => {
    if (lightboxIndex == null) return;
    setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-2">
      {title && (
        <h4 className="font-semibold text-sm">{title}</h4>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setLightboxIndex(i)}
            className="shrink-0 focus:outline-none"
          >
            <img
              src={img}
              alt={`ဓာတ်ပုံ ${i + 1}`}
              className="h-24 w-36 sm:h-32 sm:w-48 rounded-lg object-cover bg-muted hover:opacity-90 transition-opacity border border-border"
            />
          </button>
        ))}
      </div>

      {lightboxIndex != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            onClick={() => setLightboxIndex(null)}
          >
            <X size={20} />
          </Button>

          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 sm:left-4 text-white hover:bg-white/20 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
              >
                <ChevronLeft size={28} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 sm:right-4 text-white hover:bg-white/20 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
              >
                <ChevronRight size={28} />
              </Button>
            </>
          )}

          <img
            src={images[lightboxIndex]}
            alt={`ဓာတ်ပုံ ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1.5 rounded-full">
            {lightboxIndex + 1} / {images.length}
          </p>
        </div>
      )}
    </div>
  );
}
