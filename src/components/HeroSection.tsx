"use client";

import { useMemo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import InteractiveProfileCard from "@/components/profile";

export default function HeroSection() {
  const { scrollY } = useScroll();
  const translateY = useTransform(scrollY, [0, 1000], [0, -400]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  const profileCard = useMemo(() => <InteractiveProfileCard />, []);

  return (
    /* Hero Content with Parallax Text Scroll */
    <section className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-28 text-center sm:gap-14 md:flex-row md:gap-20 md:py-0">
      <motion.div
        className="order-2 max-w-5xl will-change-transform md:order-1"
        style={{ y: translateY, opacity }}
      >
        <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs sm:px-5 sm:py-2 sm:text-sm md:text-base">
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
      </motion.div>

      <div className="order-1 md:order-2">
        {profileCard}
      </div>
    </section>
  );
}
