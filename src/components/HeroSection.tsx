"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import DotMeshBackground from "@/components/DotMeshBackground";
import HeroKeywordPreview, { type HeroKeyword } from "@/components/HeroKeywordPreview";
import { useIntroSequence } from "@/components/IntroSequenceProvider";
import { globePalettes, type SelectedGlobeCard } from "@/components/ProjectSphereCanvas";
import type { FocusEvent, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

const ProjectSphereCanvas = dynamic(() => import("@/components/ProjectSphereCanvas"), { ssr: false });

interface PreviewState { keyword: HeroKeyword; x: number; y: number; }
interface CenterOffset { x: number; y: number; }
const EMAIL = "dev.harshalsharma@gmail.com";

function clampPreview(value: number, max: number, size: number) {
  return Math.max(16, Math.min(value, Math.max(16, max - size - 16)));
}

function GlobeCardOverlay({
  card,
  reducedMotion,
  onClose,
}: {
  card: SelectedGlobeCard;
  reducedMotion: boolean;
  onClose: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const colors = globePalettes[card.project.theme] ?? globePalettes.type;
  const highResUrl = `https://images.pexels.com/photos/${card.photoId}/pexels-photo-${card.photoId}.jpeg?auto=compress&cs=tinysrgb&w=1400`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8">
      {/* Full-screen frosted blur over the hero background and 200% zoomed globe */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0.15 : 0.42, ease: [0.22, 1, 0.36, 1] }}
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-2xl"
        aria-hidden="true"
      />

      {/* Sharp opened card in the center */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={card.project.title}
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.78, y: 18 }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.86, y: 12 }}
        transition={{ duration: reducedMotion ? 0.15 : 0.48, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 bg-zinc-950/85 shadow-[0_32px_100px_rgba(0,0,0,0.85)]"
      >
        <div
          className="relative aspect-[640/420] w-full overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={highResUrl}
            alt={card.project.title}
            onLoad={() => setImageLoaded(true)}
            className={`h-full w-full object-cover transition-opacity duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close card preview"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white/85 backdrop-blur-md transition hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-white/10 bg-zinc-950/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 font-mono text-[11px] text-cyan-200/80">
              {String(card.photoIndex + 1).padStart(2, "0")}
            </span>
            <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
              {card.project.title}
            </h2>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-white/45 sm:inline">
            Click outside or Esc to return
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export default function HeroSection() {
  const framerReducedMotion = useReducedMotion();
  const { phase, reducedMotion: contextReducedMotion } = useIntroSequence();
  const reducedMotion = Boolean(framerReducedMotion || contextReducedMotion);

  const heroRef = useRef<HTMLElement>(null);
  const globeSlotRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [centerOffset, setCenterOffset] = useState<CenterOffset | null>(null);
  const [selectedCard, setSelectedCard] = useState<SelectedGlobeCard | null>(null);
  const [focusOffset, setFocusOffset] = useState<CenterOffset | null>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const slot = globeSlotRef.current;
    if (!hero || !slot) return;

    const measure = () => {
      const heroRect = hero.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      if (!heroRect.width || !heroRect.height || !slotRect.width || !slotRect.height) return;
      const slotCenterInHeroX = slotRect.left - heroRect.left + slotRect.width / 2;
      const slotCenterInHeroY = slotRect.top - heroRect.top + slotRect.height / 2;
      const entryCenterInHeroX = window.innerWidth / 2 - heroRect.left;
      const entryCenterInHeroY = Math.min(heroRect.height / 2, window.innerHeight / 2);
      setCenterOffset({
        x: entryCenterInHeroX - slotCenterInHeroX,
        y: entryCenterInHeroY - slotCenterInHeroY,
      });
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(hero);
    resizeObserver.observe(slot);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (!selectedCard) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedCard(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCard]);

  const handleSelectCard = (card: SelectedGlobeCard) => {
    const slot = globeSlotRef.current;
    if (slot) {
      const slotRect = slot.getBoundingClientRect();
      setFocusOffset({
        x: window.innerWidth / 2 - (slotRect.left + slotRect.width / 2),
        y: window.innerHeight / 2 - (slotRect.top + slotRect.height / 2),
      });
    }
    setPreview(null);
    setSelectedCard(card);
  };

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

  const stageRevealed = phase !== "waiting-consent";
  const heroTextVisible = reducedMotion
    ? stageRevealed
    : phase === "hero-text" || phase === "nav-open" || phase === "complete";
  const isCardOpen = selectedCard !== null;

  const hiddenTextState = { opacity: 0, x: -16, y: 10, filter: "blur(14px)" };
  const visibleTextState = { opacity: 1, x: 0, y: 0, filter: "blur(0px)" };

  const activeFocusOffset = focusOffset ?? centerOffset ?? { x: 0, y: 0 };

  const globeAnimate = (() => {
    if (reducedMotion) {
      return {
        opacity: stageRevealed ? 1 : 0,
        x: isCardOpen ? activeFocusOffset.x : 0,
        y: isCardOpen ? activeFocusOffset.y : 0,
        scale: isCardOpen ? 2 : 1,
      };
    }
    if (phase === "waiting-consent" || !centerOffset) {
      return { opacity: 0, x: centerOffset?.x ?? 0, y: centerOffset?.y ?? 0, scale: 1 };
    }
    if (isCardOpen) {
      // Shift back to viewport center at 200% zoom (motionGroup 2.0/1.66 * CSS 1.66 = 2.0x)
      return { opacity: 1, x: activeFocusOffset.x, y: activeFocusOffset.y, scale: 1.66 };
    }
    if (phase === "globe-assembling") {
      return { opacity: 1, x: centerOffset.x, y: centerOffset.y, scale: 1 };
    }
    return { opacity: 1, x: 0, y: 0, scale: 1 };
  })();

  const globeTransition = reducedMotion
    ? { duration: 0.25 }
    : phase === "waiting-consent"
      ? { duration: 0 }
      : isCardOpen
        ? { duration: 0.72, ease: [0.65, 0, 0.35, 1] as const }
        : phase === "globe-assembling"
          ? { opacity: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const }, x: { duration: 0 }, y: { duration: 0 }, scale: { duration: 0 } }
          : { duration: 0.95, ease: [0.65, 0, 0.35, 1] as const };

  return (
    <section ref={heroRef} className="relative isolate z-10 flex min-h-[min(900px,100svh)] items-center overflow-hidden px-6 py-28 sm:px-10 md:min-h-screen md:px-14 lg:px-20">
      <motion.div
        initial={false}
        animate={{ opacity: stageRevealed ? 1 : 0 }}
        transition={{ duration: 0.75, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0"
      >
        <DotMeshBackground className="opacity-90" dotSpacing={34} interactionRadius={210} accentColor="75, 146, 255" />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_24%_48%,rgba(25,55,125,0.22),transparent_44%),linear-gradient(180deg,rgba(3,6,18,0.12),rgba(3,5,14,0.68))]" />
      </motion.div>

      <div className="relative z-10 mx-auto grid w-full max-w-[1760px] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_760px] xl:gap-0">
        <div
          className="relative z-20 max-w-3xl text-left lg:max-w-[72rem]"
          style={{ pointerEvents: heroTextVisible && !isCardOpen ? "auto" : "none" }}
        >
          <motion.div
            initial={false}
            animate={heroTextVisible ? visibleTextState : reducedMotion ? { opacity: stageRevealed ? 1 : 0, x: 0, y: 0, filter: "blur(0px)" } : hiddenTextState}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex rounded-full border border-white/20 bg-white/[0.08] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/70 backdrop-blur-md sm:px-5 sm:py-2 sm:text-xs">Polyglot Programmer <span className="mx-2 text-cyan-200/60">•</span> Full Stack <span className="mx-2 text-violet-200/60">•</span> Creative Engineering</span>
          </motion.div>
          <motion.h1
            initial={false}
            animate={heroTextVisible ? visibleTextState : reducedMotion ? { opacity: stageRevealed ? 1 : 0, x: 0, y: 0, filter: "blur(0px)" } : hiddenTextState}
            transition={{ duration: 0.7, delay: heroTextVisible && !reducedMotion ? 0.1 : 0, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 max-w-none overflow-visible text-[clamp(2.7rem,5.5vw,6.8rem)] font-extrabold leading-[0.94] tracking-[-0.055em] sm:mt-9"
          >
            <span className="block font-sans font-semibold tracking-[-0.07em] text-white/90 lg:whitespace-nowrap">Hi! I&apos;m Harshal.</span>
            <span className="mt-3 block max-w-full overflow-visible bg-linear-to-r from-cyan-100 via-white/90 to-violet-200 bg-clip-text pb-2 font-serif text-[1.05em] font-normal italic leading-[1.08] tracking-[-0.055em] text-transparent [filter:drop-shadow(0_4px_16px_rgba(255,255,255,0.12))] sm:mt-4 lg:whitespace-nowrap lg:text-[0.84em]">
              <span className="hero-keyword inline-block cursor-pointer px-1 focus-visible:outline-2 focus-visible:outline-cyan-200" {...keywordProps("MaTriX")}>MaTriX</span>{" "}
              <span className="hero-keyword inline-block cursor-pointer px-1 focus-visible:outline-2 focus-visible:outline-cyan-200" {...keywordProps("programmer")}>programmer</span>
            </span>
          </motion.h1>
          <motion.div
            initial={false}
            animate={heroTextVisible ? visibleTextState : reducedMotion ? { opacity: stageRevealed ? 1 : 0, x: 0, y: 0, filter: "blur(0px)" } : hiddenTextState}
            transition={{ duration: 0.65, delay: heroTextVisible && !reducedMotion ? 0.2 : 0, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mt-7 max-w-xl text-base leading-7 text-white/65 sm:mt-8 sm:text-lg sm:leading-8">Modern interfaces powered by code, immersive visuals and elegant engineering.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-9">
              <a href="#projects" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_12px_40px_rgba(100,180,255,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200">View Projects</a>
              <a href={`mailto:${EMAIL}`} className="rounded-full border border-white/25 bg-white/[0.07] px-5 py-3 text-sm font-semibold text-white/90 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-cyan-200/60 hover:bg-white/[0.13] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200">Let&apos;s Talk <span aria-hidden="true" className="ml-1 text-cyan-200">↗</span></a>
            </div>
          </motion.div>
        </div>

        {/* Un-transformed slot for measuring resting position; inner canvas translates smoothly via translate3d */}
        <div
          ref={globeSlotRef}
          className="relative z-10 flex w-full items-center justify-center"
        >
          <motion.div
            initial={false}
            animate={globeAnimate}
            transition={globeTransition}
            style={{ willChange: "transform, opacity" }}
          >
            <ProjectSphereCanvas
              selectedCard={selectedCard}
              onSelectCard={handleSelectCard}
            />
          </motion.div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-linear-to-t from-black/75 to-transparent" />
      {preview && !isCardOpen && <HeroKeywordPreview {...preview} />}
      <AnimatePresence>
        {selectedCard && (
          <GlobeCardOverlay
            key={selectedCard.photoIndex}
            card={selectedCard}
            reducedMotion={reducedMotion}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
