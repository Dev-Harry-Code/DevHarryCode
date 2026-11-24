"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import DotMeshBackground from "@/components/DotMeshBackground";
import HeroKeywordPreview, { type HeroKeyword } from "@/components/HeroKeywordPreview";
import type { FocusEvent, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

const ProjectSphereCanvas = dynamic(() => import("@/components/ProjectSphereCanvas"), { ssr: false });

interface PreviewState { keyword: HeroKeyword; x: number; y: number; }
const EMAIL = "dev.harshalsharma@gmail.com";

function clampPreview(value: number, max: number, size: number) {
  return Math.max(16, Math.min(value, Math.max(16, max - size - 16)));
}

export default function HeroSection() {
  const reducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const heroRef = useRef<HTMLElement>(null);
  const translateY = useTransform(scrollY, [0, 900], [0, -180]);
  const opacity = useTransform(scrollY, [0, 650], [1, 0]);
  const scale = useTransform(scrollY, [0, 900], [1, 0.96]);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const positionPreview = (clientX: number, clientY: number, keyword: HeroKeyword) => {
    const width = window.innerWidth; const height = window.innerHeight;
    setPreview({ keyword, x: clampPreview(clientX + 20, width, width < 640 ? 256 : 288), y: clampPreview(clientY + 72, height, 150) });
  };
  const showPreview = (keyword: HeroKeyword, clientX: number, clientY: number) => positionPreview(clientX, clientY, keyword);
  const handleKeywordMove = (event: ReactPointerEvent<HTMLSpanElement>, keyword: HeroKeyword) => {
    if (event.pointerType === "touch") return;
    positionPreview(event.clientX, event.clientY, keyword);
  };
  const handleKeywordFocus = (event: FocusEvent<HTMLSpanElement>, keyword: HeroKeyword) => { const rect = event.currentTarget.getBoundingClientRect(); showPreview(keyword, rect.left, rect.bottom); };
  const handleKeywordKeyDown = (event: ReactKeyboardEvent<HTMLSpanElement>, keyword: HeroKeyword) => {
    if (event.key !== "Enter" && event.key !== " ") return; event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect(); showPreview(keyword, rect.left, rect.bottom);
  };
  const keywordProps = (keyword: HeroKeyword) => ({
    tabIndex: 0, role: "button" as const, "aria-label": `Definition of ${keyword}`,
    onPointerMove: (event: ReactPointerEvent<HTMLSpanElement>) => handleKeywordMove(event, keyword),
    onKeyDown: (event: ReactKeyboardEvent<HTMLSpanElement>) => handleKeywordKeyDown(event, keyword),
    onFocus: (event: FocusEvent<HTMLSpanElement>) => handleKeywordFocus(event, keyword),
    onBlur: () => setPreview(null),
    onPointerLeave: (event: ReactPointerEvent<HTMLSpanElement>) => { if (event.pointerType !== "touch") setPreview(null); },
  });
  const enter = reducedMotion ? { opacity: 1, x: 0, y: 0, scale: 1 } : undefined;

  return (
    <section ref={heroRef} className="relative isolate z-10 flex min-h-[min(900px,100svh)] items-center overflow-hidden px-6 py-28 sm:px-10 md:min-h-screen md:px-14 lg:px-20">
      <DotMeshBackground className="opacity-90" dotSpacing={34} interactionRadius={210} accentColor="75, 146, 255" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_24%_48%,rgba(25,55,125,0.22),transparent_44%),linear-gradient(180deg,rgba(3,6,18,0.12),rgba(3,5,14,0.68))]" />
      <motion.div className="relative z-10 mx-auto grid w-full max-w-[1760px] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_760px] xl:gap-0" style={reducedMotion ? undefined : { y: translateY, opacity, scale }}>
        <div className="max-w-3xl text-left lg:max-w-[72rem]">
          <motion.div initial={reducedMotion ? enter : { opacity: 0, y: 18 }} animate={enter ?? { opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
            <span className="inline-flex rounded-full border border-white/20 bg-white/[0.08] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/70 backdrop-blur-md sm:px-5 sm:py-2 sm:text-xs">Polyglot Programmer <span className="mx-2 text-cyan-200/60">•</span> Full Stack <span className="mx-2 text-violet-200/60">•</span> Creative Engineering</span>
          </motion.div>
          <motion.h1 initial={reducedMotion ? enter : { opacity: 0, y: 24 }} animate={enter ?? { opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }} className="mt-7 max-w-none overflow-visible text-[clamp(2.7rem,5.5vw,6.8rem)] font-extrabold leading-[0.94] tracking-[-0.055em] sm:mt-9">
            <span className="block font-sans font-semibold tracking-[-0.07em] text-white/90 lg:whitespace-nowrap">Hi! I&apos;m Harshal.</span>
            <span className="mt-3 block max-w-full overflow-visible bg-linear-to-r from-cyan-100 via-white/90 to-violet-200 bg-clip-text pb-2 font-serif text-[1.05em] font-normal italic leading-[1.08] tracking-[-0.055em] text-transparent [filter:drop-shadow(0_4px_16px_rgba(255,255,255,0.12))] sm:mt-4 lg:whitespace-nowrap lg:text-[0.84em]">
              <span className="hero-keyword inline-block cursor-pointer px-1 focus-visible:outline-2 focus-visible:outline-cyan-200" {...keywordProps("MaTriX")}>MaTriX</span>{" "}
              <span className="hero-keyword inline-block cursor-pointer px-1 focus-visible:outline-2 focus-visible:outline-cyan-200" {...keywordProps("programmer")}>programmer</span>
            </span>
          </motion.h1>
          <motion.div initial={reducedMotion ? enter : { opacity: 0, y: 18 }} animate={enter ?? { opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.27, ease: [0.16, 1, 0.3, 1] }}>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/65 sm:mt-8 sm:text-lg sm:leading-8">Modern interfaces powered by code, immersive visuals and elegant engineering.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-9">
              <a href="#projects" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_12px_40px_rgba(100,180,255,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200">View Projects</a>
              <a href={`mailto:${EMAIL}`} className="rounded-full border border-white/25 bg-white/[0.07] px-5 py-3 text-sm font-semibold text-white/90 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-cyan-200/60 hover:bg-white/[0.13] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200">Let&apos;s Talk <span aria-hidden="true" className="ml-1 text-cyan-200">↗</span></a>
            </div>
          </motion.div>
        </div>
        <motion.div initial={reducedMotion ? enter : { opacity: 0, y: 28, scale: 0.94 }} animate={enter ?? { opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.72, delay: 0.38, ease: [0.16, 1, 0.3, 1] }} className="flex w-full justify-center lg:justify-center">
          <ProjectSphereCanvas />
        </motion.div>
      </motion.div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-linear-to-t from-black/75 to-transparent" />
      {preview && <HeroKeywordPreview {...preview} />}
    </section>
  );
}
