"use client";

import React, { useEffect, useRef } from "react";
import { Renderer, Camera, Transform, Program, Mesh, Triangle } from "ogl";
import { cn } from "@/lib/utils";

interface LiquidGlassProps {
  children?: React.ReactNode;
  className?: string;
  blurAmount?: string;
  enabled?: boolean;
}

export default function LiquidGlass({
  children,
  className = "",
  blurAmount = "16px",
  enabled = true,
}: LiquidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<[number, number]>([0.5, 0.5]);
  const targetMouseRef = useRef<[number, number]>([0.5, 0.5]);
  const enabledFactorRef = useRef<number>(enabled ? 1.0 : 0.0);
  const wakeLoopRef = useRef<((withRipple?: boolean) => void) | null>(null);

  useEffect(() => {
    enabledFactorRef.current = enabled ? 1.0 : 0.0;
    wakeLoopRef.current?.(false);
  }, [enabled]);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const isMobile =
      window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;

    // 1. WebGL Renderer (capped DPR & low-power profile on mobile GPUs)
    const renderer = new Renderer({
      alpha: true,
      dpr: isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5),
      antialias: !isMobile,
      powerPreference: isMobile ? "low-power" : "default",
    });

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);

    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    // 2. Camera & Scene
    const camera = new Camera(gl);
    camera.position.z = 1;
    const scene = new Transform();
    const geometry = new Triangle(gl);

    // 3. Optimized Apple Glass Shader (mediump + precomputed aspect + gated ripple)
    const program = new Program(gl, {
      vertex: /* glsl */ `
        attribute vec2 position;
        attribute vec2 uv;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `,

      fragment: /* glsl */ `
        precision mediump float;

        uniform float uTime;
        uniform float uAspect;
        uniform vec2 uMouse;
        uniform float uEnabled;
        uniform float uRippleAmp;

        varying vec2 vUv;

        float sdRoundedBox(vec2 p, vec2 b, float r) {
          vec2 q = abs(p) - b + vec2(r);
          return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
        }

        float heightMap(vec2 st, vec2 mouse, float time, vec2 halfSize) {
          float edgeDist = sdRoundedBox(st, halfSize, 0.35);
          float edgeBevel = smoothstep(0.0, -0.18, edgeDist) * smoothstep(-0.4, -0.02, edgeDist) * 0.15;

          float mouseRipple = 0.0;
          if (uRippleAmp > 0.002) {
            float dMouse = length(st - mouse);
            mouseRipple = sin(dMouse * 8.0 - time * 2.0) * exp(-dMouse * 2.5) * 0.04 * uRippleAmp;
          }

          return (edgeBevel + mouseRipple) * uEnabled;
        }

        void main() {
          if (uEnabled <= 0.002) {
            gl_FragColor = vec4(0.0);
            return;
          }

          vec2 st = (vUv - 0.5) * 2.0;
          st.x *= uAspect;

          vec2 mouse = (uMouse - 0.5) * 2.0;
          mouse.x *= uAspect;

          vec2 halfSize = vec2(uAspect * 0.90, 0.90);

          // Surface Normals
          vec2 e = vec2(0.008, 0.0);
          float h  = heightMap(st, mouse, uTime, halfSize);
          float hX = heightMap(st + e.xy, mouse, uTime, halfSize);
          float hY = heightMap(st + e.yx, mouse, uTime, halfSize);

          vec3 N = normalize(vec3((h - hX) / e.x, (h - hY) / e.x, 0.9));
          vec3 V = vec3(0.0, 0.0, 1.0);

          vec3 lightPos = vec3(mouse, 1.5);
          vec3 L = normalize(lightPos - vec3(st, 0.0));
          vec3 H = normalize(L + V);

          // Specular Glints & Fresnel Rim
          float NdotV = max(dot(N, V), 0.0);
          float fresnel = pow(1.0 - NdotV, 4.0);

          float NdotH = max(dot(N, H), 0.0);
          float sharpSpecular = NdotH > 0.4 ? pow(NdotH, 96.0) * 0.8 : 0.0;
          float broadSpecular = NdotH > 0.05 ? pow(NdotH, 20.0) * 0.15 : 0.0;

          vec3 specularColor = vec3(1.0) * (sharpSpecular + broadSpecular);
          vec3 rimColor = vec3(0.9, 0.95, 1.0) * fresnel * 0.35;

          vec3 finalColor = (specularColor + rimColor) * uEnabled;
          float alpha = clamp((fresnel * 0.25 + sharpSpecular * 0.4) * uEnabled, 0.0, 0.35);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,

      uniforms: {
        uTime: { value: 0 },
        uAspect: { value: 1 },
        uMouse: { value: [0.5, 0.5] },
        uEnabled: { value: 0 },
        uRippleAmp: { value: 0 },
      },
      transparent: true,
      depthTest: false,
    });

    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);

    let animationFrameId = 0;
    let currentEnabled = enabledFactorRef.current;
    let rippleAmp = 0;
    let lastInteractionTime = performance.now();
    const startTime = performance.now();
    let visible = true;
    let documentVisible = document.visibilityState === "visible";
    let hasSize = false;
    let lastFrameTime = -1;
    let isLoopRunning = false;

    const FRAME_INTERVAL = isMobile ? 1000 / 30 : 1000 / 60;

    function renderFrame(elapsed: number) {
      if (!hasSize) return;
      program.uniforms.uTime.value = elapsed;
      program.uniforms.uMouse.value = mouseRef.current;
      program.uniforms.uEnabled.value = currentEnabled;
      program.uniforms.uRippleAmp.value = rippleAmp;
      if (currentEnabled > 0.002) {
        renderer.render({ scene, camera });
      } else {
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    }

    function wakeLoop(withRipple = false) {
      if (withRipple) {
        rippleAmp = 1.0;
        lastInteractionTime = performance.now();
      }
      if (!isLoopRunning && visible && documentVisible && hasSize) {
        if (enabledFactorRef.current > 0.002 || currentEnabled > 0.002) {
          isLoopRunning = true;
          lastFrameTime = performance.now();
          animationFrameId = requestAnimationFrame(update);
        }
      }
    }

    wakeLoopRef.current = wakeLoop;

    function update(now: number) {
      if (!visible || !documentVisible || !hasSize) {
        isLoopRunning = false;
        return;
      }

      if (lastFrameTime < 0 || now - lastFrameTime >= FRAME_INTERVAL) {
        lastFrameTime = now;
        const elapsed = (now - startTime) * 0.001;

        mouseRef.current[0] += (targetMouseRef.current[0] - mouseRef.current[0]) * 0.08;
        mouseRef.current[1] += (targetMouseRef.current[1] - mouseRef.current[1]) * 0.08;
        currentEnabled += (enabledFactorRef.current - currentEnabled) * 0.12;

        // Fade ripple out smoothly when pointer is idle so GPU sleeps cleanly
        const idleMs = now - lastInteractionTime;
        const targetRipple = idleMs < 1400 && !isMobile ? 1.0 : 0.0;
        rippleAmp += (targetRipple - rippleAmp) * 0.08;

        renderFrame(elapsed);

        const mouseSettled =
          Math.abs(targetMouseRef.current[0] - mouseRef.current[0]) < 0.002 &&
          Math.abs(targetMouseRef.current[1] - mouseRef.current[1]) < 0.002;
        const enabledSettled = Math.abs(enabledFactorRef.current - currentEnabled) < 0.002;
        const rippleSettled = rippleAmp < 0.003 && targetRipple === 0;

        if (mouseSettled && enabledSettled && rippleSettled) {
          currentEnabled = enabledFactorRef.current;
          rippleAmp = 0;
          renderFrame(elapsed);
          isLoopRunning = false;
          return;
        }
      }

      animationFrameId = requestAnimationFrame(update);
    }

    // 4. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          hasSize = true;
          renderer.setSize(width, height);
          program.uniforms.uAspect.value = width / Math.max(height, 1.0);
          renderFrame((performance.now() - startTime) * 0.001);
          wakeLoop(false);
        } else {
          hasSize = false;
        }
      }
    });

    resizeObserver.observe(container);

    // 5. Mouse tracking (skip on touch/mobile devices)
    function handlePointerMove(e: PointerEvent) {
      if (e.pointerType === "touch" || !container || !hasSize) return;
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      targetMouseRef.current = [x, y];
      if (enabledFactorRef.current > 0.002) {
        wakeLoop(true);
      }
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    const handleVisibilityChange = () => {
      documentVisible = document.visibilityState === "visible";
      if (documentVisible && visible && hasSize) {
        wakeLoop(false);
      }
    };

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        if (visible && documentVisible && hasSize) {
          wakeLoop(false);
        }
      },
      { rootMargin: "100px" }
    );
    visibilityObserver.observe(container);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (enabledFactorRef.current > 0.002) {
      wakeLoop(false);
    }

    return () => {
      wakeLoopRef.current = null;
      cancelAnimationFrame(animationFrameId);
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      if (gl.canvas.parentNode) {
        gl.canvas.parentNode.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  const blurStyle = enabled ? `blur(${blurAmount})` : "none";

  return (
    <div
      ref={containerRef}
      style={{
        backdropFilter: blurStyle,
        WebkitBackdropFilter: blurStyle,
      }}
      className={cn("relative isolate overflow-hidden transition-all duration-300", className)}
    >
      {/* WebGL Glass Specular Overlay */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      />

      {/* Content flex wrapper */}
      <div className="relative z-10 flex h-full w-full items-center justify-between whitespace-nowrap">
        {children}
      </div>
    </div>
  );
}
