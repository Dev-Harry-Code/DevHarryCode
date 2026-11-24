"use client";

import { useEffect, useRef } from "react";
import styles from "./DotMeshBackground.module.css";

interface DotMeshBackgroundProps {
  className?: string;
  dotSpacing?: number;
  interactionRadius?: number;
  accentColor?: string;
}

interface Dot {
  x: number;
  y: number;
  phase: number;
  secondaryPhase: number;
}

interface Ripple {
  x: number;
  y: number;
  startedAt: number;
}

const MAX_RIPPLES = 4;
const DEFAULT_ACCENT = "118, 154, 255";

export default function DotMeshBackground({
  className = "",
  dotSpacing = 22,
  interactionRadius = 190,
  accentColor = DEFAULT_ACCENT,
}: DotMeshBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const interactionTarget = root.parentElement ?? root;

    const context = canvas.getContext("2d");
    if (!context) return;

    const isMobile =
      window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;

    let width = 0;
    let height = 0;
    let devicePixelRatio = 1;
    let dots: Dot[] = [];
    let animationFrame = 0;
    let isRunning = false;
    let visible = true;
    let documentVisible = document.visibilityState === "visible";
    let reducedMotion = false;
    let lastTime = performance.now();
    let lastDrawTime = 0;
    let lastPointerTime = lastTime;
    let pointerSpeed = 0;

    const pointer = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      active: false,
    };
    const ripples: Ripple[] = [];

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const baseFill = `rgba(${accentColor}, 0.32)`;
    const interactionRadiusSq = interactionRadius * interactionRadius;
    const TWO_PI = Math.PI * 2;

    const buildDots = () => {
      dots = [];
      const minSpacing = isMobile ? Math.max(40, dotSpacing) : Math.max(14, dotSpacing);
      const spacing = Math.min(48, minSpacing);
      const columns = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let row = -1; row < rows; row += 1) {
        for (let column = -1; column < columns; column += 1) {
          dots.push({
            x: column * spacing,
            y: row * spacing,
            phase: (column * 17.31 + row * 29.17) % TWO_PI,
            secondaryPhase: (column * 7.13 - row * 11.47) % TWO_PI,
          });
        }
      }
    };

    const draw = (now: number, forceStatic = false) => {
      if (!width || !height) return;

      const elapsed = Math.min(80, now - lastTime);
      lastTime = now;
      const time = now * 0.001;
      const animationTime = reducedMotion || forceStatic ? 0 : time;
      const smoothing = reducedMotion ? 1 : Math.min(1, elapsed / 90);
      pointer.x += (pointer.targetX - pointer.x) * smoothing;
      pointer.y += (pointer.targetY - pointer.y) * smoothing;
      pointerSpeed *= reducedMotion ? 0 : 0.92;

      context.clearRect(0, 0, width, height);

      const activeRipples = ripples.filter((ripple) => now - ripple.startedAt < 1500);
      ripples.splice(0, ripples.length, ...activeRipples);
      const hasPointer = pointer.active && !reducedMotion;
      const hasRipples = activeRipples.length > 0;

      // Batch all non-interactive idle dots into a single path fill
      context.fillStyle = baseFill;
      context.beginPath();

      const activeDots: { x: number; y: number; radius: number; alpha: number }[] = [];

      for (let i = 0; i < dots.length; i += 1) {
        const dot = dots[i];
        const idleX = reducedMotion ? dot.x : dot.x + Math.sin(animationTime * 0.38 + dot.phase) * 0.8;
        const idleY = reducedMotion ? dot.y : dot.y + Math.cos(animationTime * 0.31 + dot.secondaryPhase) * 0.8;

        let influence = 0;
        let directionX = 0;
        let directionY = 0;

        if (hasPointer) {
          const dx = idleX - pointer.x;
          const dy = idleY - pointer.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < interactionRadiusSq) {
            const distance = Math.sqrt(distSq);
            const norm = 1 - distance / interactionRadius;
            influence = norm * norm;
            if (distance > 0.001) {
              directionX = dx / distance;
              directionY = dy / distance;
            }
          }
        }

        let rippleInfluence = 0;
        if (hasRipples) {
          for (let r = 0; r < activeRipples.length; r += 1) {
            const ripple = activeRipples[r];
            const age = (now - ripple.startedAt) / 1000;
            const rippleRadius = age * 170;
            const rdx = idleX - ripple.x;
            const rdy = idleY - ripple.y;
            const rippleDistance = Math.hypot(rdx, rdy);
            const ringDistance = Math.abs(rippleDistance - rippleRadius);
            if (ringDistance < 36) {
              rippleInfluence += Math.exp(-(ringDistance * ringDistance) / 180) * Math.max(0, 1 - age / 1.5);
              if (rippleDistance > 0.001 && influence === 0) {
                directionX = rdx / rippleDistance;
                directionY = rdy / rippleDistance;
              }
            }
          }
        }

        if (influence > 0.005 || rippleInfluence > 0.005) {
          const x = idleX + directionX * (influence * 5 + rippleInfluence * 2);
          const y = idleY + directionY * (influence * 5 + rippleInfluence * 2);
          const alpha = Math.min(0.9, 0.32 + influence * (0.52 + pointerSpeed * 0.2) + rippleInfluence * 0.3);
          const radius = 0.85 + influence * (1.85 + pointerSpeed * 0.6) + rippleInfluence * 0.65;
          activeDots.push({ x, y, radius, alpha });
        } else {
          context.moveTo(idleX + 0.85, idleY);
          context.arc(idleX, idleY, 0.85, 0, TWO_PI);
        }
      }

      context.fill();

      for (let i = 0; i < activeDots.length; i += 1) {
        const d = activeDots[i];
        context.fillStyle = `rgba(${accentColor}, ${d.alpha.toFixed(2)})`;
        context.beginPath();
        context.arc(d.x, d.y, d.radius, 0, TWO_PI);
        context.fill();
      }
    };

    const startLoop = () => {
      if (isRunning || !visible || !documentVisible || reducedMotion) return;
      isRunning = true;
      lastTime = performance.now();
      animationFrame = requestAnimationFrame(loop);
    };

    const stopLoop = () => {
      if (!isRunning) return;
      isRunning = false;
      cancelAnimationFrame(animationFrame);
    };

    const loop = (now: number) => {
      if (!visible || !documentVisible || reducedMotion) {
        isRunning = false;
        return;
      }
      const minInterval = isMobile && ripples.length === 0 ? 1000 / 24 : 0;
      if (minInterval === 0 || now - lastDrawTime >= minInterval) {
        lastDrawTime = now;
        draw(now);
      }
      animationFrame = requestAnimationFrame(loop);
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      devicePixelRatio = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(width * devicePixelRatio));
      canvas.height = Math.max(1, Math.round(height * devicePixelRatio));
      buildDots();
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      draw(performance.now(), true);
    };

    const setPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = root.getBoundingClientRect();
      const nextX = Math.max(0, Math.min(width, event.clientX - rect.left));
      const nextY = Math.max(0, Math.min(height, event.clientY - rect.top));
      const elapsed = Math.max(16, performance.now() - lastPointerTime);
      const distance = Math.hypot(nextX - pointer.targetX, nextY - pointer.targetY);

      pointer.targetX = nextX;
      pointer.targetY = nextY;
      pointer.active = true;
      pointerSpeed = Math.min(1, distance / elapsed / 1.2);
      lastPointerTime = performance.now();
    };

    const addRipple = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      ripples.push({
        x: Math.max(0, Math.min(width, event.clientX - rect.left)),
        y: Math.max(0, Math.min(height, event.clientY - rect.top)),
        startedAt: performance.now(),
      });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      pointerSpeed = 0;
    };

    const handleVisibilityChange = () => {
      documentVisible = document.visibilityState === "visible";
      if (documentVisible && visible) {
        startLoop();
      } else {
        stopLoop();
      }
    };

    const updateMotionPreference = () => {
      reducedMotion = motionQuery.matches;
      if (reducedMotion) {
        pointer.active = false;
        ripples.length = 0;
        stopLoop();
      } else {
        startLoop();
      }
      draw(performance.now(), reducedMotion);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? false;
        if (visible && documentVisible) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { rootMargin: "160px" },
    );

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    observer.observe(root);
    motionQuery.addEventListener("change", updateMotionPreference);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    interactionTarget.addEventListener("pointermove", setPointer, { passive: true });
    interactionTarget.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    interactionTarget.addEventListener("pointerdown", addRipple, { passive: true });

    reducedMotion = motionQuery.matches;
    resize();
    startLoop();

    return () => {
      stopLoop();
      resizeObserver.disconnect();
      observer.disconnect();
      motionQuery.removeEventListener("change", updateMotionPreference);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      interactionTarget.removeEventListener("pointermove", setPointer);
      interactionTarget.removeEventListener("pointerleave", handlePointerLeave);
      interactionTarget.removeEventListener("pointerdown", addRipple);
    };
  }, [dotSpacing, interactionRadius, accentColor]);

  return (
    <div ref={rootRef} className={`${styles.root} ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
