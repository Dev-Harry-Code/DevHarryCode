/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useRef } from "react";
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

  // Mouse tracking
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, {
    stiffness: 220,
    damping: 22,
    mass: 0.4,
  });

  const mouseY = useSpring(y, {
    stiffness: 220,
    damping: 22,
    mass: 0.4,
  });

  // Card tilt
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [18, -18]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-18, 18]);

  // Floating image movement
  const imageX = useTransform(mouseX, [-0.5, 0.5], [-12, 12]);
  const imageY = useTransform(mouseY, [-0.5, 0.5], [-12, 12]);

  // Reflection movement
  const shineX = useTransform(mouseX, [-0.5, 0.5], ["10%", "90%"]);
  const shineY = useTransform(mouseY, [-0.5, 0.5], ["10%", "90%"]);

  // Fix: Dynamically template motion values into string format
  const shineBackground = useMotionTemplate`radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.28), transparent 65%)`;

  const glareX = useTransform(mouseX, [-0.5, 0.5], [-60, 60]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], [-60, 60]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();

    const mouseXPos = (e.clientX - rect.left) / rect.width - 0.5;
    const mouseYPos = (e.clientY - rect.top) / rect.height - 0.5;

    x.set(mouseXPos);
    y.set(mouseYPos);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="relative mt-10 flex justify-center perspective-[1800px]">
      {/* Dim Blurry Shadow */}
      <div className="absolute inset-2 rounded-[40px] bg-black/60 blur-3xl pointer-events-none" />

      <motion.div
        animate={{
          y: [-8, 8, -8],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{
            scale: 1.04,
          }}
          whileTap={{
            scale: 0.98,
          }}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          className="
            group
            relative
            h-85
            w-72.5
            overflow-hidden
            rounded-[34px]

            border border-white/15
            bg-white/6

            backdrop-blur-3xl
            backdrop-saturate-150

            shadow-[0_30px_80px_rgba(0,0,0,0.45)]
          "
        >
          {/* Profile Image Background */}
          <Image
            src="/profile.jpg"
            alt="Profile photo"
            fill
            className="object-cover"
            sizes="2560px"
            priority
          />

          {/* Glass Overlay over Image */}
          <div
            className="
              absolute
              inset-0
              rounded-[34px]
              bg-linear-to-br
              from-black/20
              via-transparent
              to-black/40
            "
          />

          {/* Inner Border */}
          <div
            className="
              absolute
              inset-px
              rounded-[33px]
              border
              border-white/10
              pointer-events-none
            "
          />

          {/* Top Reflection */}
          <div
            className="
              absolute
              top-0
              left-0
              h-24
              w-full
              bg-linear-to-b
              from-white/20
              to-transparent
              pointer-events-none
            "
          />

          {/* Dynamic Glass Reflection */}
          <motion.div
            style={{
              background: shineBackground,
            }}
            className="
              absolute
              inset-0
              pointer-events-none
            "
          />

          {/* Moving Light Beam */}
          <motion.div
            style={{
              x: glareX,
              y: glareY,
            }}
            className="
              absolute
              -left-40
              -top-40
              h-112.5
              w-40
              rotate-12

              bg-linear-to-r
              from-transparent
              via-white/20
              to-transparent

              blur-3xl
              pointer-events-none
            "
          />
        </motion.div>
      </motion.div>
    </div>
  );
}