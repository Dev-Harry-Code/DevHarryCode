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
    blurAmount = "20px",
    enabled = true,
  }: LiquidGlassProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const mouseRef = useRef<[number, number]>([0.5, 0.5]);
    const targetMouseRef = useRef<[number, number]>([0.5, 0.5]);
    const enabledFactorRef = useRef<number>(enabled ? 1.0 : 0.0);

    useEffect(() => {
      enabledFactorRef.current = enabled ? 1.0 : 0.0;
    }, [enabled]);

    useEffect(() => {
      const container = canvasContainerRef.current;
      if (!container) return;

      // 1. WebGL Renderer
      const renderer = new Renderer({
        alpha: true,
        dpr: Math.min(window.devicePixelRatio, 2),
        antialias: true,
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

      // 3. Apple Glass Shader
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
          uniform float uEnabled;

          varying vec2 vUv;

          float sdRoundedBox(vec2 p, vec2 b, float r) {
            vec2 q = abs(p) - b + vec2(r);
            return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
          }

          float heightMap(vec2 st, vec2 mouse, float time, float aspect) {
            // Responsive aspect-ratio bevel padding
            vec2 halfSize = vec2(aspect * 0.90, 0.90);
            float edgeDist = sdRoundedBox(st, halfSize, 0.35);
            float edgeBevel = smoothstep(0.0, -0.18, edgeDist) * smoothstep(-0.4, -0.02, edgeDist) * 0.15;

            // Subtle interactive mouse ripple
            float dMouse = length(st - mouse);
            float mouseRipple = sin(dMouse * 8.0 - time * 2.0) * exp(-dMouse * 2.5) * 0.04;

            return (edgeBevel + mouseRipple) * uEnabled;
          }

          void main() {
            if (uEnabled <= 0.001) {
              gl_FragColor = vec4(0.0);
              return;
            }

            float aspect = uResolution.x / max(uResolution.y, 1.0);
            vec2 st = (vUv - 0.5) * 2.0;
            st.x *= aspect;

            vec2 mouse = (uMouse - 0.5) * 2.0;
            mouse.x *= aspect;

            float time = uTime;

            // Surface Normals
            vec2 e = vec2(0.008, 0.0);
            float h  = heightMap(st, mouse, time, aspect);
            float hX = heightMap(st + e.xy, mouse, time, aspect);
            float hY = heightMap(st + e.yx, mouse, time, aspect);

            vec3 N = normalize(vec3((h - hX) / e.x, (h - hY) / e.x, 0.9));
            vec3 V = vec3(0.0, 0.0, 1.0);

            vec3 lightPos = vec3(mouse, 1.5);
            vec3 L = normalize(lightPos - vec3(st, 0.0));
            vec3 H = normalize(L + V);

            // Specular Glints & Fresnel Rim
            float NdotV = max(dot(N, V), 0.0);
            float fresnel = pow(1.0 - NdotV, 4.0);

            float NdotH = max(dot(N, H), 0.0);
            float sharpSpecular = pow(NdotH, 96.0) * 0.8;
            float broadSpecular = pow(NdotH, 20.0) * 0.15;

            vec3 specularColor = vec3(1.0) * (sharpSpecular + broadSpecular);
            vec3 rimColor = vec3(0.9, 0.95, 1.0) * fresnel * 0.35;

            vec3 finalColor = (specularColor + rimColor) * uEnabled;
            float alpha = clamp((fresnel * 0.25 + sharpSpecular * 0.4) * uEnabled, 0.0, 0.35);

            gl_FragColor = vec4(finalColor, alpha);
          }
        `,

        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: [0, 0] },
          uMouse: { value: [0.5, 0.5] },
          uEnabled: { value: 0 },
        },
        transparent: true,
        depthTest: false,
      });

      const mesh = new Mesh(gl, { geometry, program });
      mesh.setParent(scene);

      // 4. Resize Observer
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

      // 5. Mouse tracking
      function handleMouseMove(e: MouseEvent) {
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1.0 - (e.clientY - rect.top) / rect.height;
        targetMouseRef.current = [x, y];
      }

      window.addEventListener("mousemove", handleMouseMove);

      // 6. Animation Loop
      let animationFrameId: number;
      let currentEnabled = enabledFactorRef.current;
      const startTime = performance.now();

      function update(now: number) {
        const elapsed = (now - startTime) * 0.001;

        mouseRef.current[0] += (targetMouseRef.current[0] - mouseRef.current[0]) * 0.06;
        mouseRef.current[1] += (targetMouseRef.current[1] - mouseRef.current[1]) * 0.06;
        currentEnabled += (enabledFactorRef.current - currentEnabled) * 0.08;

        program.uniforms.uTime.value = elapsed;
        program.uniforms.uMouse.value = mouseRef.current;
        program.uniforms.uEnabled.value = currentEnabled;

        renderer.render({ scene, camera });
        animationFrameId = requestAnimationFrame(update);
      }

      animationFrameId = requestAnimationFrame(update);

      return () => {
        cancelAnimationFrame(animationFrameId);
        resizeObserver.disconnect();
        window.removeEventListener("mousemove", handleMouseMove);
        if (gl.canvas.parentNode) {
          gl.canvas.parentNode.removeChild(gl.canvas);
        }
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