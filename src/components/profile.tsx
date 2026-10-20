"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from "framer-motion";

export default function InteractiveProfileCard() {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [active, setActive] = useState(false);
  const [focusBurst, setFocusBurst] = useState(false);
  const [frameMode, setFrameMode] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Raw pointer position, normalized to -0.5..0.5 on each axis
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 300, damping: 30, mass: 0.6 });
  const mouseY = useSpring(y, { stiffness: 300, damping: 30, mass: 0.6 });

  // Tilt — kept tight so it reads as precise rather than floppy
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);

  // Grounded shadow: shifts opposite the tilt, as if light is fixed
  // overhead and the card is genuinely lifting off the page.
  const shadowX = useTransform(mouseX, [-0.5, 0.5], [22, -22]);
  const shadowY = useTransform(mouseY, [-0.5, 0.5], [14, -14]);
  const shadowBlur = useTransform(
    [mouseX, mouseY],
    ([lx, ly]: number[]) => 40 + Math.min(1, Math.hypot(lx, ly) * 2.2) * 30
  );
  const shadowOpacity = useTransform(
    [mouseX, mouseY],
    ([lx, ly]: number[]) => 0.35 + Math.min(1, Math.hypot(lx, ly) * 2.2) * 0.25
  );
  const dropShadow = useMotionTemplate`drop-shadow(${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`;

  // Soft highlight that tracks the pointer directly
  const shineX = useTransform(mouseX, [-0.5, 0.5], ["12%", "88%"]);
  const shineY = useTransform(mouseY, [-0.5, 0.5], ["12%", "88%"]);
  const shineBackground = useMotionTemplate`radial-gradient(220px circle at ${shineX} ${shineY}, rgba(255,255,255,0.5), transparent 70%)`;

  // A thin ring of light that orbits the frame, angled toward the pointer.
  // This is the one bold move — everything else stays quiet around it.
  const ringAngle = useTransform(
    [mouseX, mouseY],
    ([lx, ly]: number[]) => (Math.atan2(ly, lx) * 180) / Math.PI
  );
  const ringOpacity = useTransform(
    [mouseX, mouseY],
    ([lx, ly]: number[]) => Math.min(1, Math.hypot(lx, ly) * 2.4)
  );
  const ringBackground = useMotionTemplate`conic-gradient(from ${ringAngle}deg, transparent 0deg, rgba(255,255,255,0.9) 18deg, transparent 60deg)`;

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!cardRef.current || reducedMotion) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
    setActive(false);
  };

  const toggleFocusBurst = () => {
    setFrameMode((current) => (current + 1) % 5);
    setFocusBurst((current) => !current);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleFocusBurst();
    }
  };

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 34, scale: 0.88, filter: "blur(14px)" }}
      animate={reducedMotion ? {} : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.9, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-10 flex justify-center perspective-[1700px]"
    >
      <motion.div
        animate={reducedMotion ? {} : { y: active ? 0 : [-7, 7, -7] }}
        transition={{
          duration: 5.5,
          repeat: active ? 0 : Infinity,
          ease: "easeInOut",
        }}
      >
        <motion.button
          type="button"
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerEnter={() => setActive(true)}
          onPointerLeave={handlePointerLeave}
          onClick={toggleFocusBurst}
          onKeyDown={handleKeyDown}
          role="button"
          aria-label="Interactive profile photo. Activate to cycle its 3D frame."
          aria-pressed={focusBurst}
          whileTap={{ scale: 0.96 }}
          animate={
            reducedMotion
              ? {}
              : focusBurst
                ? { rotateZ: 1.5, scale: 1.04 }
                : { rotateZ: 0, scale: 1 }
          }
          transition={{ type: "spring", stiffness: 240, damping: 18 }}
          style={{
            rotateX: reducedMotion ? 0 : rotateX,
            rotateY: reducedMotion ? 0 : rotateY,
            transformStyle: "preserve-3d",
            filter: reducedMotion ? "none" : dropShadow,
            touchAction: "none",
          }}
          className="group relative h-86 w-72.5 cursor-pointer rounded-[32px] border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/80 focus-visible:ring-offset-4 focus-visible:ring-offset-black"
        >
          {/* Clickable 3D frame variants: cube, stack, orbit and flip frames. */}
          {frameMode === 1 && (
            <>
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, rotateY: -70 }}
                animate={{ opacity: 1, rotateY: -90 }}
                className="pointer-events-none absolute inset-y-3 -left-4 w-4 origin-right border border-white/20 bg-white/[0.08]"
                style={{ transformStyle: "preserve-3d" }}
              />
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, rotateY: 70 }}
                animate={{ opacity: 1, rotateY: 90 }}
                className="pointer-events-none absolute inset-y-3 -right-4 w-4 origin-left border border-white/20 bg-white/[0.08]"
                style={{ transformStyle: "preserve-3d" }}
              />
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, rotateX: 70 }}
                animate={{ opacity: 1, rotateX: 90 }}
                className="pointer-events-none absolute -top-4 inset-x-3 h-4 origin-bottom border border-white/20 bg-white/[0.1]"
                style={{ transformStyle: "preserve-3d" }}
              />
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, rotateX: -70 }}
                animate={{ opacity: 1, rotateX: -90 }}
                className="pointer-events-none absolute -bottom-4 inset-x-3 h-4 origin-top border border-white/20 bg-white/[0.1]"
                style={{ transformStyle: "preserve-3d" }}
              />
            </>
          )}

          {frameMode === 2 && (
            <>
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, x: -16, y: 10, rotateZ: -4 }}
                animate={{ opacity: 0.75, x: -16, y: 10, rotateZ: -4 }}
                className="pointer-events-none absolute inset-0 rounded-[32px] border border-cyan-200/40 [transform:translateZ(-32px)]"
              />
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, x: 16, y: -10, rotateZ: 4 }}
                animate={{ opacity: 0.75, x: 16, y: -10, rotateZ: 4 }}
                className="pointer-events-none absolute inset-0 rounded-[32px] border border-violet-200/40 [transform:translateZ(-18px)]"
              />
            </>
          )}

          {frameMode === 3 && (
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0, rotateZ: -8, scale: 0.92 }}
              animate={{ opacity: 0.9, rotateZ: -8, scale: 0.92 }}
              className="pointer-events-none absolute -inset-4 rounded-[42px] border border-white/35 border-dashed [transform:translateZ(-28px)]"
            />
          )}

          {frameMode === 4 && (
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0, rotateY: 65, x: 18 }}
              animate={{ opacity: 0.85, rotateY: 65, x: 18 }}
              className="pointer-events-none absolute inset-2 rounded-[26px] border border-white/30 bg-white/[0.05] [transform:translateZ(-42px)]"
              style={{ transformStyle: "preserve-3d" }}
            />
          )}

          {/* Orbiting light-trace ring — the signature element */}
          <motion.div
            style={{
              background: ringBackground,
              opacity: reducedMotion ? 0 : ringOpacity,
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
            className="pointer-events-none absolute -inset-1.5 rounded-[33px] p-1.5"
          />

          <motion.div
            aria-hidden="true"
            animate={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: focusBurst ? 0.9 : 0.3, rotateZ: focusBurst ? -4 : 0 }
            }
            transition={{ duration: 0.35 }}
            className="pointer-events-none absolute -inset-5 rounded-[40px] border border-cyan-200/30 bg-cyan-300/[0.03] [transform:translateZ(-18px)]"
          />

          <motion.div
            aria-hidden="true"
            animate={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: focusBurst ? 0.65 : 0, scale: focusBurst ? 1.08 : 1 }
            }
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute -inset-3 rounded-[36px] border border-violet-200/30 [transform:translateZ(12px)]"
          />

          <div
            className="absolute inset-0 overflow-hidden rounded-[32px] border border-white/15 bg-black"
          >
            {/* Photo, pushed slightly forward in 3D space for real depth */}
            <div
              className="absolute -inset-2.5"
              style={{ transform: focusBurst ? "translateZ(56px) scale(1.1)" : "translateZ(24px) scale(1.06)" }}
            >
              <Image
                src="/profile.jpg"
                alt="Profile photo"
                fill
                className="object-cover"
                sizes="400px"
                priority
              />
            </div>

            {/* Depth gradient for legibility and richness */}
            <div className="absolute inset-0 bg-linear-to-br from-black/10 via-transparent to-black/50" />

            {/* Top glass reflection */}
            <div className="absolute top-0 left-0 h-24 w-full bg-linear-to-b from-white/10 to-transparent pointer-events-none" />

            {/* Pointer-tracking highlight */}
            <motion.div
              style={{ background: shineBackground, mixBlendMode: "soft-light" }}
              className="absolute inset-0 pointer-events-none"
            />

            {/* Inner hairline */}
            <div
              className="pointer-events-none absolute inset-0 rounded-[32px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            />
          </div>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
