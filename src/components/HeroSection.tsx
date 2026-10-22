"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import InteractiveProfileCard from "@/components/profile";
import HeroKeywordPreview, {
  HERO_PREVIEWS,
  type HeroKeyword,
} from "@/components/HeroKeywordPreview";
import type { PointerEvent as ReactPointerEvent, FocusEvent, KeyboardEvent as ReactKeyboardEvent } from "react";

interface PreviewState {
  keyword: HeroKeyword;
  index: number;
  x: number;
  y: number;
}

const keywordRects = new WeakMap<HTMLElement, DOMRect>();

function quantizePointer(value: number) {
  return Math.round(value / 10) * 10;
}

export default function HeroSection() {
  const { scrollY } = useScroll();
  const translateY = useTransform(scrollY, [0, 1000], [0, -400]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  useEffect(() => {
    // Preload keyword preview images during idle time after the hero entrance completes
    const preload = () => {
      Object.values(HERO_PREVIEWS)
        .flat()
        .forEach((src) => {
          const image = new window.Image();
          image.src = src;
        });
    };
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const handle = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(preload, { timeout: 2000 });
      return () => (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(handle);
    } else {
      const timer = setTimeout(preload, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const showPreview = (keyword: HeroKeyword, clientX: number, clientY: number, index = 0) => {
    setPreview({
      keyword,
      index,
      x: quantizePointer(clientX + 20),
      y: quantizePointer(clientY + 22),
    });
  };

  const handleKeywordMove = (event: ReactPointerEvent<HTMLSpanElement>, keyword: HeroKeyword) => {
    if (event.pointerType === "touch") return;
    const target = event.currentTarget;
    let rect = keywordRects.get(target);
    if (!rect) {
      rect = target.getBoundingClientRect();
      keywordRects.set(target, rect);
    }
    const relativeX = Math.max(0, Math.min(rect.width - 1, event.clientX - rect.left));
    const index = Math.floor(relativeX / 5) % HERO_PREVIEWS[keyword].length;
    const x = quantizePointer(event.clientX + 20);
    const y = quantizePointer(event.clientY + 22);
    setPreview({ keyword, index, x, y });
  };

  const handleKeywordFocus = (event: FocusEvent<HTMLSpanElement>, keyword: HeroKeyword) => {
    const rect = event.currentTarget.getBoundingClientRect();
    showPreview(keyword, rect.left, rect.bottom);
  };

  const handleKeywordTouch = (event: ReactPointerEvent<HTMLSpanElement>, keyword: HeroKeyword) => {
    if (event.pointerType !== "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const nextIndex = preview?.keyword === keyword
      ? (preview.index + 1) % HERO_PREVIEWS[keyword].length
      : 0;
    showPreview(keyword, rect.left, rect.bottom, nextIndex);
  };

  const handleKeywordKeyDown = (event: ReactKeyboardEvent<HTMLSpanElement>, keyword: HeroKeyword) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const nextIndex = preview?.keyword === keyword
      ? (preview.index + 1) % HERO_PREVIEWS[keyword].length
      : 0;
    showPreview(keyword, rect.left, rect.bottom, nextIndex);
  };

  const keywordProps = (keyword: HeroKeyword) => ({
    tabIndex: 0,
    role: "button" as const,
    "aria-label": `Preview ${keyword}`,
    onPointerMove: (event: ReactPointerEvent<HTMLSpanElement>) => handleKeywordMove(event, keyword),
    onPointerUp: (event: ReactPointerEvent<HTMLSpanElement>) => handleKeywordTouch(event, keyword),
    onKeyDown: (event: ReactKeyboardEvent<HTMLSpanElement>) => handleKeywordKeyDown(event, keyword),
    onFocus: (event: FocusEvent<HTMLSpanElement>) => handleKeywordFocus(event, keyword),
    onBlur: (event: FocusEvent<HTMLSpanElement>) => {
      keywordRects.delete(event.currentTarget);
      setPreview(null);
    },
    onPointerLeave: (event: ReactPointerEvent<HTMLSpanElement>) => {
      keywordRects.delete(event.currentTarget);
      if (event.pointerType !== "touch") setPreview(null);
    },
  });

  return (
    <section className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-28 text-center sm:gap-14 md:flex-row md:gap-20 md:py-0">
      <motion.div
        className="order-2 max-w-5xl md:order-1"
        style={{ y: translateY, opacity }}
      >
        <motion.div
          initial={{ opacity: 0, x: -36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="will-change-[transform,opacity] [transform:translateZ(0)]"
        >
          <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs sm:px-5 sm:py-2 sm:text-sm md:text-base">
            Polyglot Programmer • Full Stack • Creative Engineering
          </span>

        <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:mt-8 sm:text-5xl md:text-6xl lg:text-8xl">
          <span className="font-mono text-white/90">Hi! I&apos;m Harshal.</span>
          <span className="block bg-linear-to-r from-cyan-100/90 via-white/80 to-violet-200/70 bg-clip-text font-serif font-normal italic tracking-normal text-transparent [filter:drop-shadow(0_4px_16px_rgba(255,255,255,0.12))]">
            <span className="hero-keyword inline-block cursor-help rounded-lg px-1 transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-2 focus-visible:outline-cyan-200" {...keywordProps("MaTriX")}>MaTriX</span>{" "}
            <span className="hero-keyword inline-block cursor-help rounded-lg px-1 transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-2 focus-visible:outline-cyan-200" {...keywordProps("programmer")}>programmer</span>
          </span>
        </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base text-white/70 sm:mt-8 sm:text-lg">
            Modern interfaces powered by code, immersive visuals and elegant
            engineering.
          </p>
        </motion.div>
      </motion.div>

      <div className="order-1 md:order-2">
        <InteractiveProfileCard />
      </div>

      {preview && <HeroKeywordPreview {...preview} />}
    </section>
  );
}
