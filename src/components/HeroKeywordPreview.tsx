"use client";

import Image from "next/image";

export type HeroKeyword = "MaTriX" | "programmer";

const imageSet = (folder: string, name: string) =>
  Array.from({ length: 10 }, (_, index) =>
    `/assets/${folder}/${name}-${String(index + 1).padStart(2, "0")}.jpg`,
  );

export const HERO_PREVIEWS: Record<HeroKeyword, string[]> = {
  MaTriX: imageSet("matrix", "matrix"),
  programmer: imageSet("programmer", "programmer"),
};

interface HeroKeywordPreviewProps {
  keyword: HeroKeyword;
  index: number;
  x: number;
  y: number;
}

export default function HeroKeywordPreview({ keyword, index, x, y }: HeroKeywordPreviewProps) {
  const preview = HERO_PREVIEWS[keyword][index] ?? HERO_PREVIEWS[keyword][0];

  return (
    <div
      className="pointer-events-none fixed z-50 block w-52 overflow-hidden rounded-2xl sm:w-56"
      style={{
        left: `clamp(1rem, ${x}px, calc(100vw - 15rem))`,
        top: `clamp(1rem, ${y}px, calc(100vh - 12rem))`,
      }}
      aria-hidden="true"
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl">
        <Image
          key={preview}
          src={preview}
          alt=""
          fill
          sizes="224px"
          className="object-cover"
          unoptimized
        />
      </div>
    </div>
  );
}
