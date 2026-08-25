"use client";

import { useScrollPosition } from "@/lib/hooks/useScrollPosition";
import InteractiveProfileCard from "@/components/profile";

export default function HeroSection() {
  const scrollY = useScrollPosition();

  return (
    /* Hero Content with Parallax Text Scroll */
    <section className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-28 text-center sm:gap-14 md:flex-row md:gap-20 md:py-0">
      <div
        className="order-2 max-w-5xl transition-transform duration-75 ease-out md:order-1"
        style={{
          transform: `translateY(${scrollY * -0.4}px)`,
          opacity: Math.max(0, 1 - scrollY / 400),
        }}
      >
        <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs backdrop-blur-xl sm:px-5 sm:py-2 sm:text-sm md:text-base">
          Polyglot Programmer • Full Stack • Creative Engineering
        </span>

        <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:mt-8 sm:text-5xl md:text-6xl lg:text-8xl">
          <span className="font-mono text-white/90">Hi! I&apos;m Harshal.</span>
          <span className="block font-serif italic font-normal tracking-normal bg-linear-to-r from-cyan-100/90 via-white/80 to-violet-200/70 bg-clip-text text-transparent drop-shadow-[0_8px_20px_rgba(255,255,255,0.15)]">
            MaTriX programmer
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-base text-white/70 sm:mt-8 sm:text-lg">
          Modern interfaces powered by code, immersive visuals and elegant
          engineering.
        </p>
      </div>

      <div className="order-1 md:order-2">
        <InteractiveProfileCard />
      </div>
    </section>
  );
}
