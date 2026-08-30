/* eslint-disable @typescript-eslint/no-unused-vars */
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
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

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
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

  return (
    <div className="relative mt-10 flex justify-center perspective-[1700px]">
      <motion.div
        animate={reducedMotion ? {} : { y: active ? 0 : [-7, 7, -7] }}
        transition={{
          duration: 5.5,
          repeat: active ? 0 : Infinity,
          ease: "easeInOut",
        }}
      >
        <motion.div
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerEnter={() => setActive(true)}
          onPointerLeave={handlePointerLeave}
          whileTap={{ scale: 0.97 }}
          style={{
            rotateX: reducedMotion ? 0 : rotateX,
            rotateY: reducedMotion ? 0 : rotateY,
            transformStyle: "preserve-3d",
            filter: reducedMotion ? "none" : dropShadow,
            touchAction: "none",
          }}
          className="group relative h-86 w-72.5 cursor-pointer rounded-[32px]"
        >
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

          <div className="absolute inset-0 overflow-hidden rounded-[32px] border border-white/15 bg-black">
            {/* Photo, pushed slightly forward in 3D space for real depth */}
            <div
              className="absolute -inset-2.5"
              style={{ transform: "translateZ(24px) scale(1.06)" }}
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
            <div className="pointer-events-none absolute inset-0 rounded-[32px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}