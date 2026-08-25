"use client";

import React, { useEffect, useRef } from "react";
import { Renderer, Camera, Transform, Program, Mesh, Triangle, Texture } from "ogl";
import { useShaderExcludeRegistry } from "./ShaderExcludeContext";

interface MouseShaderProps {
  children?: React.ReactNode;
  className?: string;
  imageSrc?: string;
  rippleIntensity?: number;
  rippleSpeed?: number;
  rippleRadius?: number;
  chromaticShift?: number;
  accelThreshold?: number;
  enabled?: boolean;
}

interface ClickRipple {
  x: number;
  y: number;
  startTime: number;
}

const MAX_RIPPLES = 5;
const MAX_EXCLUDE = 4;

export const MouseShader: React.FC<MouseShaderProps> = ({
  children,
  className = "",
  imageSrc,
  rippleIntensity = 0.08,
  rippleSpeed = 3.5,
  rippleRadius = 12.0,
  chromaticShift = 0.025,
  accelThreshold = 0.025,
  enabled = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const mouseRef = useRef<[number, number]>([0.5, 0.5]);
  const smoothedMouseRef = useRef<[number, number]>([0.5, 0.5]);
  const prevPxMouseRef = useRef<[number, number]>([0, 0]);
  const velocityRef = useRef<[number, number]>([0, 0]);
  const prevVelocityRef = useRef<[number, number]>([0, 0]);
  const accelRef = useRef<number>(0);

  // Movement Tracking for 10px spatial threshold
  const distMovedPxRef = useRef<number>(0);

  // Inertia retention variables
  const lastActiveAccelRef = useRef<number>(0);
  const stopTimeRef = useRef<number | null>(null);

  // Ring buffer for tracking up to MAX_RIPPLES overlapping clicks
  const clickRipplesRef = useRef<ClickRipple[]>([]);
  const enabledFactorRef = useRef<number>(enabled ? 1.0 : 0.0);

  // Registry of elements to exclude from the shader effect (navbar, about section, etc.)
  const excludeRegistry = useShaderExcludeRegistry();

  useEffect(() => {
    enabledFactorRef.current = enabled ? 1.0 : 0.0;
  }, [enabled]);

  useEffect(() => {
    const isPointerDevice = window.matchMedia("(pointer: fine)").matches;
    if (!isPointerDevice) return;

    const container = canvasContainerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      alpha: true,
      dpr: Math.min(window.devicePixelRatio, 2),
      antialias: true,
      premultipliedAlpha: false,
    });

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);

    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    const camera = new Camera(gl);
    camera.position.z = 1;
    const scene = new Transform();
    const geometry = new Triangle(gl);

    const texture = new Texture(gl, { generateMipmaps: false });
    let hasTexture = false;

    if (imageSrc) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageSrc;
      img.onload = () => {
        texture.image = img;
        hasTexture = true;
      };
    }

    const initialClicks: [number, number, number][] = Array.from(
      { length: MAX_RIPPLES },
      () => [-1.0, -1.0, -9999.0]
    );

    const initialExcludeRects: [number, number, number, number][] = Array.from(
      { length: MAX_EXCLUDE },
      () => [-1.0, -1.0, -1.0, -1.0]
    );

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
        precision highp float;

        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        uniform vec2 uVelocity;
        uniform float uAcceleration;
        uniform float uEnabled;
        uniform float uRippleIntensity;
        uniform float uRippleSpeed;
        uniform float uRippleRadius;
        uniform float uChromaticShift;
        uniform bool uHasTexture;
        uniform sampler2D tMap;

        uniform vec3 uClicks[5];
        uniform vec4 uExcludeRects[4];

        varying vec2 vUv;

        bool inExcludeZone(vec2 uv) {
          for (int i = 0; i < 4; i++) {
            vec4 r = uExcludeRects[i];
            if (r.x < -0.5) continue; // sentinel: disabled slot
            if (uv.x >= r.x && uv.x <= r.z && uv.y >= r.y && uv.y <= r.w) {
              return true;
            }
          }
          return false;
        }

        float processSingleRipple(vec3 clickData, vec2 st, float time, float aspect, float intensity, float speed, float radius) {
          float maxAge = 1.8; 
          float age = time - clickData.z;
          
          if (age <= 0.0 || age >= maxAge) return 0.0;

          vec2 clickPos = (clickData.xy - 0.5) * 2.0;
          clickPos.x *= aspect;

          float dist = length(st - clickPos);
          
          // Slow, compact expansion
          float waveRadius = age * 0.09425; 
          float d = dist - waveRadius;

          // Thin single wave ring
          float freq = 65.0; 
          float x = d * freq;
          
          float wave = 0.0;
          if (x >= -3.14159265 && x <= 3.14159265) {
            wave = sin(x) * (0.5 + 0.5 * cos(x));
          }

          float progress = age / maxAge;
          
          // Smooth fade-in at birth + continuous cubic fade-out to opacity 0
          float fadeIn = smoothstep(0.0, 0.1, progress);
          float fadeOut = pow(1.0 - progress, 2.5);
          float timeDecay = fadeIn * fadeOut;

          return wave * timeDecay * intensity * 1.6;
        }

        float heightMap(vec2 st, vec2 mouse, float time, vec2 vel, float accel) {
          float h = 0.0;
          float aspect = uResolution.x / max(uResolution.y, 1.0);

          for (int i = 0; i < 5; i++) {
            h += processSingleRipple(uClicks[i], st, time, aspect, uRippleIntensity, uRippleSpeed, uRippleRadius);
          }

          vec2 aspectVel = vel;
          aspectVel.x *= aspect;
          
          if (accel > 0.0001) {
            float offsetAmount = 10.0 / max(uResolution.y, 1.0);
            vec2 velDirUnit = length(aspectVel) > 0.0001 ? normalize(aspectVel) : vec2(0.0, 1.0);
            vec2 offsetMouse = mouse - velDirUnit * offsetAmount;

            float dMouse = length(st - offsetMouse);
            vec2 dir = normalize(st - offsetMouse + vec2(0.0001));

            float alignment = max(0.0, dot(-dir, velDirUnit));
            
            float streakShape = exp(-dMouse * uRippleRadius * 0.8) * pow(alignment, 2.2);
            float streakWave = sin(dMouse * 50.0 - time * 12.0);
            
            h += streakWave * streakShape * accel * uRippleIntensity * 1.2;
          }

          return h * uEnabled;
        }

        void main() {
          if (inExcludeZone(vUv)) {
            if (uHasTexture) {
              gl_FragColor = texture2D(tMap, vUv);
            } else {
              discard;
            }
            return;
          }

          if (uEnabled <= 0.001) {
            if (uHasTexture) {
              gl_FragColor = texture2D(tMap, vUv);
            } else {
              discard;
            }
            return;
          }

          float aspect = uResolution.x / max(uResolution.y, 1.0);
          vec2 st = (vUv - 0.5) * 2.0;
          st.x *= aspect;

          vec2 mouse = (uMouse - 0.5) * 2.0;
          mouse.x *= aspect;

          float time = uTime;

          vec2 e = vec2(0.003, 0.0);
          float h  = heightMap(st, mouse, time, uVelocity, uAcceleration);
          float hX = heightMap(st + e.xy, mouse, time, uVelocity, uAcceleration);
          float hY = heightMap(st + e.yx, mouse, time, uVelocity, uAcceleration);

          vec3 N = normalize(vec3((h - hX) / e.x, (h - hY) / e.x, 0.55));
          vec3 V = vec3(0.0, 0.0, 1.0);

          vec3 lightPos = vec3(mouse + uVelocity * 0.3, 1.0);
          vec3 L = normalize(lightPos - vec3(st, 0.0));
          vec3 H = normalize(L + V);

          float NdotV = max(dot(N, V), 0.0);
          float fresnel = pow(1.0 - NdotV, 4.0);

          float NdotH = max(dot(N, H), 0.0);
          float sharpSpecular = pow(NdotH, 96.0) * 0.6;
          float broadSpecular = pow(NdotH, 24.0) * 0.2;

          vec3 specularOverlay = vec3(1.0) * (sharpSpecular + broadSpecular);
          vec3 reflectionRim = vec3(0.9, 0.95, 1.0) * fresnel * 0.25;

          if (uHasTexture) {
            vec2 refractionOffset = N.xy * uChromaticShift;

            float r = texture2D(tMap, vUv + refractionOffset * 0.8).r;
            float g = texture2D(tMap, vUv + refractionOffset * 1.2).g;
            float b = texture2D(tMap, vUv + refractionOffset * 1.6).b;

            vec3 refractedColor = vec3(r, g, b);
            vec3 finalColor = refractedColor + specularOverlay + reflectionRim;

            gl_FragColor = vec4(finalColor, 1.0);
          } else {
            float totalMask = abs(h) * 15.0;

            // Feather alpha cleanly down to 0 instead of abrupt pixel cuts
            float fadeMask = smoothstep(0.001, 0.02, totalMask);

            vec3 liquidColor = specularOverlay + reflectionRim;
            float alpha = clamp((sharpSpecular * 0.8 + totalMask * 0.4) * uEnabled, 0.0, 0.85) * fadeMask;

            if (alpha <= 0.001) {
              discard;
            }

            gl_FragColor = vec4(liquidColor, alpha);
          }
        }
      `,

      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [0, 0] },
        uMouse: { value: [0.5, 0.5] },
        uVelocity: { value: [0, 0] },
        uAcceleration: { value: 0 },
        uEnabled: { value: 0 },
        uRippleIntensity: { value: rippleIntensity },
        uRippleSpeed: { value: rippleSpeed },
        uRippleRadius: { value: rippleRadius },
        uChromaticShift: { value: chromaticShift },
        uHasTexture: { value: false },
        tMap: { value: texture },
        uClicks: { value: initialClicks },
        uExcludeRects: { value: initialExcludeRects },
      },
      transparent: true,
      depthTest: false,
    });

    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          renderer.setSize(width, height);
          program.uniforms.uResolution.value = [width, height];
        }
      }
    });

    resizeObserver.observe(container);

    const startTime = performance.now();

    function handleMouseMove(e: MouseEvent) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      
      const pxX = e.clientX;
      const pxY = e.clientY;
      const dx = pxX - prevPxMouseRef.current[0];
      const dy = pxY - prevPxMouseRef.current[1];
      const distPx = Math.sqrt(dx * dx + dy * dy);

      distMovedPxRef.current += distPx;
      prevPxMouseRef.current = [pxX, pxY];

      mouseRef.current = [x, y];
    }

    function handleClick(e: MouseEvent) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;

      const elapsedSec = (performance.now() - startTime) * 0.001;
      
      if (clickRipplesRef.current.length >= MAX_RIPPLES) {
        clickRipplesRef.current.shift();
      }
      clickRipplesRef.current.push({ x, y, startTime: elapsedSec });
    }

    const parentDiv = containerRef.current;
    if (parentDiv) {
      parentDiv.addEventListener("mousemove", handleMouseMove);
      parentDiv.addEventListener("click", handleClick);
    }

    // Computes normalized exclusion rects (in shader UV space) from
    // whatever elements are currently registered via useShaderExclude()
    function computeExcludeRects(): [number, number, number, number][] {
      const rects: [number, number, number, number][] = [];
      const contEl = containerRef.current;

      if (contEl) {
        const contRect = contEl.getBoundingClientRect();
        const entries = Array.from(excludeRegistry.values()).slice(0, MAX_EXCLUDE);

        entries.forEach((ref) => {
          const el = ref.current;
          if (!el || contRect.width === 0 || contRect.height === 0) {
            rects.push([-1, -1, -1, -1]);
            return;
          }
          const r = el.getBoundingClientRect();
          const minX = (r.left - contRect.left) / contRect.width;
          const maxX = (r.right - contRect.left) / contRect.width;
          // Flip Y to match uMouse's convention (v=0 bottom, v=1 top)
          const minY = 1 - (r.bottom - contRect.top) / contRect.height;
          const maxY = 1 - (r.top - contRect.top) / contRect.height;
          rects.push([minX, minY, maxX, maxY]);
        });
      }

      while (rects.length < MAX_EXCLUDE) rects.push([-1, -1, -1, -1]);
      return rects;
    }

    let animationFrameId: number;
    let currentEnabled = enabledFactorRef.current;

    function update(now: number) {
      const elapsed = (now - startTime) * 0.001;

      const smx = smoothedMouseRef.current[0];
      const smy = smoothedMouseRef.current[1];
      smoothedMouseRef.current[0] += (mouseRef.current[0] - smx) * 0.08;
      smoothedMouseRef.current[1] += (mouseRef.current[1] - smy) * 0.08;

      const vx = smoothedMouseRef.current[0] - smx;
      const vy = smoothedMouseRef.current[1] - smy;
      
      velocityRef.current[0] += (vx - velocityRef.current[0]) * 0.12;
      velocityRef.current[1] += (vy - velocityRef.current[1]) * 0.12;

      const ax = velocityRef.current[0] - prevVelocityRef.current[0];
      const ay = velocityRef.current[1] - prevVelocityRef.current[1];
      const rawAccel = Math.sqrt(ax * ax + ay * ay) * 100.0;

      const isHighAcceleration = rawAccel > accelThreshold;
      const hasMoved10px = distMovedPxRef.current >= 10.0;

      const activeAccel = (isHighAcceleration && hasMoved10px) ? Math.min(rawAccel * 2.5, 1.0) : 0.0;

      if (activeAccel > 0.05) {
        accelRef.current = activeAccel;
        lastActiveAccelRef.current = activeAccel;
        stopTimeRef.current = null;
      } else {
        distMovedPxRef.current *= 0.88;

        if (stopTimeRef.current === null && lastActiveAccelRef.current > 0) {
          stopTimeRef.current = elapsed;
        }

        if (stopTimeRef.current !== null) {
          const stopDuration = elapsed - stopTimeRef.current;
          const DECAY_DURATION = 0.6;

          if (stopDuration < DECAY_DURATION) {
            const progress = stopDuration / DECAY_DURATION;
            const decay = Math.pow(1.0 - progress, 2.0);
            accelRef.current = lastActiveAccelRef.current * decay;
          } else {
            accelRef.current = 0.0;
            lastActiveAccelRef.current = 0.0;
            stopTimeRef.current = null;
          }
        }
      }

      prevVelocityRef.current = [...velocityRef.current];
      currentEnabled += (enabledFactorRef.current - currentEnabled) * 0.08;

      const clicksTuples: [number, number, number][] = [];
      for (let i = 0; i < MAX_RIPPLES; i++) {
        const ripple = clickRipplesRef.current[i];
        if (ripple) {
          clicksTuples.push([ripple.x, ripple.y, ripple.startTime]);
        } else {
          clicksTuples.push([-1.0, -1.0, -9999.0]);
        }
      }

      program.uniforms.uClicks.value = clicksTuples;
      program.uniforms.uExcludeRects.value = computeExcludeRects();
      program.uniforms.uTime.value = elapsed;
      program.uniforms.uMouse.value = smoothedMouseRef.current;
      program.uniforms.uVelocity.value = velocityRef.current;
      program.uniforms.uAcceleration.value = accelRef.current;
      program.uniforms.uEnabled.value = currentEnabled;
      program.uniforms.uRippleIntensity.value = rippleIntensity;
      program.uniforms.uRippleSpeed.value = rippleSpeed;
      program.uniforms.uRippleRadius.value = rippleRadius;
      program.uniforms.uChromaticShift.value = chromaticShift;
      program.uniforms.uHasTexture.value = hasTexture;

      renderer.render({ scene, camera });
      animationFrameId = requestAnimationFrame(update);
    }

    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (parentDiv) {
        parentDiv.removeEventListener("mousemove", handleMouseMove);
        parentDiv.removeEventListener("click", handleClick);
      }
      if (gl.canvas.parentNode) {
        gl.canvas.parentNode.removeChild(gl.canvas);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc, rippleIntensity, rippleSpeed, rippleRadius, chromaticShift, accelThreshold]);

  return (
    <div
      ref={containerRef}
      className={`relative isolate overflow-hidden ${className}`}
    >
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 z-10 pointer-events-none overflow-hidden"
      />
      <div className="relative z-0 h-full w-full">{children}</div>
    </div>
  );
};

export default MouseShader;