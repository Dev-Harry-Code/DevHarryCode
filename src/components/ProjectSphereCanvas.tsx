"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useInertiaDrag } from "@/components/useInertiaDrag";
import { useIntroSequence, type IntroPhase } from "@/components/IntroSequenceProvider";
import styles from "./ProjectSphereCanvas.module.css";

type Palette = [string, string, string];
type Project = {
  title: string;
  theme: string;
};

const palettes: Record<string, Palette> = {
  orb: ["#f8f7f4", "#f5b7c7", "#5c65e8"],
  predz: ["#111820", "#192735", "#42d69a"],
  room: ["#e4d8f0", "#70b65e", "#e79b45"],
  north: ["#dae9f6", "#33516b", "#8daec4"],
  forma: ["#f8e8d7", "#dd8462", "#476f66"],
  after: ["#241c35", "#422771", "#a658e5"],
  type: ["#f5eee5", "#452e50", "#bf7474"],
  green: ["#e6eee0", "#385d4a", "#a4ba7b"],
  warm: ["#f4e4d9", "#965b46", "#dca377"],
  blue: ["#e2edf4", "#315578", "#65a2c3"],
};

const projects: Project[] = [
  { title: "Voice Orb", theme: "orb" },
  { title: "PREDZ", theme: "predz" },
  { title: "Isometric Room", theme: "room" },
  { title: "Northstar", theme: "north" },
  { title: "Forma", theme: "forma" },
  { title: "Afterhours", theme: "after" },
  ...[
    "Monogram",
    "Soft Systems",
    "Morrow",
    "Orbit Finance",
    "Field Notes",
    "Kindred",
    "Studio No. 8",
    "Lowkey",
    "Common Ground",
    "Signal",
    "Daybreak",
    "Elsewhere",
    "Goodform",
    "Parallel",
    "New Ritual",
    "Open House",
  ].map((title, index) => ({ title, theme: ["type", "green", "warm", "blue"][index % 4] })),
];

const pexelsPhotoIds = [
  26311729, 27413514, 671658, 12393620, 34198832, 17007191, 9399127, 11838589, 3218443, 29960817,
  7036091, 30666562, 13172740, 27413515, 14257762, 32045753, 6942460, 5446097, 33314038, 675257,
  14434884, 1274111, 14910369, 17826353, 13291279, 29389340, 18125203, 36520397, 13034833, 12597242,
  33164661, 10967985, 19940222, 35771810, 35315868, 12932105, 8067157, 26508696, 2923526, 36045210,
  28769445, 17622430, 6196079, 5226084, 40695384, 5712837, 15311343, 7741609, 240040, 2599142,
  2858265, 32420917, 6661427, 33931028, 6498997, 17662493,
];
const photoUrls = pexelsPhotoIds.map(
  (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=640`,
);

function makeSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutQuint(t: number) {
  return 1 - Math.pow(1 - t, 5);
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function makeSharedBackTexture(): THREE.CanvasTexture {
  const backCanvas = document.createElement("canvas");
  backCanvas.width = 256;
  backCanvas.height = 168;
  const backContext = backCanvas.getContext("2d");
  if (!backContext) throw new Error("Unable to create the globe card back canvas");
  backContext.beginPath();
  backContext.roundRect(0, 0, 256, 168, 24);
  backContext.fillStyle = "#d3d2cd";
  backContext.fill();

  const backTexture = new THREE.CanvasTexture(backCanvas);
  backTexture.colorSpace = THREE.SRGBColorSpace;
  backTexture.anisotropy = 2;
  return backTexture;
}

function makeRadialGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to create glow texture");
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(180, 222, 255, 0.95)");
  gradient.addColorStop(0.28, "rgba(110, 175, 255, 0.42)");
  gradient.addColorStop(0.62, "rgba(130, 130, 255, 0.12)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeFrontTexture(project: Project, index: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 420;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to create the globe artwork canvas");

  const colors = palettes[project.theme] ?? palettes.type;
  context.beginPath();
  context.roundRect(0, 0, 640, 420, 58);
  context.clip();

  const background = context.createLinearGradient(0, 0, 640, 420);
  background.addColorStop(0, colors[0]);
  background.addColorStop(1, colors[1]);
  context.fillStyle = background;
  context.fillRect(0, 0, 640, 420);

  if (project.theme === "orb") {
    context.fillStyle = "#f7f5f1";
    context.fillRect(0, 0, 640, 420);
    const gradient = context.createRadialGradient(300, 175, 8, 330, 205, 130);
    gradient.addColorStop(0, "#fff");
    gradient.addColorStop(0.32, "#92a7ff");
    gradient.addColorStop(0.62, "#7554e9");
    gradient.addColorStop(1, "#ef9fba");
    context.shadowColor = "#8169ff";
    context.shadowBlur = 32;
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(330, 200, 112, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
  } else if (project.theme === "predz") {
    context.fillStyle = "#111820";
    context.fillRect(0, 0, 640, 420);
    context.fillStyle = "#e6f5ec";
    context.font = "bold 24px Arial";
    context.fillText("PREDZ  /  MARKETS", 32, 44);
    context.strokeStyle = "#47d69c";
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(32, 294);
    [[95, 260], [150, 278], [210, 188], [270, 220], [330, 126], [390, 164], [450, 99], [520, 120], [602, 62]].forEach(([x, y]) => context.lineTo(x, y));
    context.stroke();
    context.fillStyle = "#46d49b";
    context.font = "bold 44px Arial";
    context.fillText("$24,891", 32, 112);
    context.fillStyle = "#82928d";
    context.font = "18px Arial";
    context.fillText("+8.42% THIS WEEK", 34, 143);
  } else if (project.theme === "room") {
    context.fillStyle = "#e8dcf1";
    context.fillRect(0, 0, 640, 420);
    context.fillStyle = "#b9d4ae";
    context.beginPath();
    context.moveTo(320, 80);
    context.lineTo(550, 190);
    context.lineTo(320, 300);
    context.lineTo(90, 190);
    context.closePath();
    context.fill();
    context.fillStyle = "#79aa70";
    context.beginPath();
    context.moveTo(90, 190);
    context.lineTo(320, 300);
    context.lineTo(320, 380);
    context.lineTo(90, 270);
    context.closePath();
    context.fill();
    context.fillStyle = "#a2cc88";
    context.beginPath();
    context.moveTo(550, 190);
    context.lineTo(320, 300);
    context.lineTo(320, 380);
    context.lineTo(550, 270);
    context.closePath();
    context.fill();
    context.fillStyle = "#efb878";
    context.fillRect(210, 205, 58, 62);
    context.fillStyle = "#75558e";
    context.fillRect(370, 225, 68, 46);
    context.fillStyle = "#f4cf86";
    context.beginPath();
    context.arc(320, 154, 30, 0, Math.PI * 2);
    context.fill();
  } else {
    context.fillStyle = colors[0];
    context.fillRect(0, 0, 640, 420);
    const ink = project.theme === "after" || project.theme === "predz" ? "#f2f2f1" : "#232a2b";
    context.fillStyle = colors[1];
    context.fillRect(0, 0, 640, 48);
    context.fillStyle = "#ffffff";
    context.globalAlpha = 0.85;
    context.fillRect(26, 18, 92, 9);
    context.globalAlpha = 1;
    context.fillStyle = ink;
    context.font = "bold 30px Arial";
    context.fillText(project.title.toUpperCase(), 30, 102);
    context.globalAlpha = 0.38;
    context.fillRect(31, 120, 235, 8);
    context.fillRect(31, 137, 178, 7);
    context.globalAlpha = 1;

    if (index % 3 === 0) {
      context.fillStyle = colors[2];
      context.beginPath();
      context.arc(466, 236, 105, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = colors[1];
      context.fillRect(28, 183, 220, 190);
      context.fillStyle = colors[0];
      context.fillRect(45, 201, 186, 22);
      context.fillRect(45, 238, 144, 11);
      context.fillRect(45, 260, 165, 11);
      context.fillRect(45, 310, 96, 35);
    } else if (index % 3 === 1) {
      context.fillStyle = colors[1];
      context.fillRect(30, 178, 580, 190);
      context.fillStyle = colors[0];
      context.fillRect(48, 198, 544, 30);
      for (let tile = 0; tile < 5; tile += 1) {
        context.fillStyle = tile % 2 ? colors[2] : colors[0];
        context.globalAlpha = 0.82;
        context.fillRect(50 + tile * 105, 252, 82, 92);
        context.globalAlpha = 1;
      }
    } else {
      context.fillStyle = colors[1];
      context.fillRect(360, 166, 248, 205);
      context.fillStyle = colors[2];
      context.fillRect(30, 174, 295, 194);
      context.strokeStyle = colors[0];
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(45, 322);
      context.lineTo(91, 288);
      context.lineTo(142, 301);
      context.lineTo(190, 241);
      context.lineTo(245, 262);
      context.lineTo(306, 205);
      context.stroke();
    }
  }

  context.fillStyle = project.theme === "predz" ? "#c9d8d0" : "#4e4a46";
  context.font = "18px Arial";
  context.fillText(String(index + 1).padStart(2, "0"), 22, 30);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const photo = new Image();
  photo.crossOrigin = "anonymous";
  photo.onload = () => {
    context.clearRect(0, 0, 640, 420);
    context.save();
    context.beginPath();
    context.roundRect(0, 0, 640, 420, 58);
    context.clip();
    const scale = Math.max(640 / photo.width, 420 / photo.height);
    const width = photo.width * scale;
    const height = photo.height * scale;
    context.drawImage(photo, (640 - width) / 2, (420 - height) / 2, width, height);
    context.restore();
    texture.needsUpdate = true;
  };
  photo.src = photoUrls[index];

  return texture;
}

type CardAnimation = {
  delay: number;
  flightDuration: number;
  swirlTurns: number;
  swirlAxis: [number, number, number];
  spinAngles: [number, number, number];
};

type CardProps = {
  project: Project;
  position: [number, number, number];
  index: number;
  animation: CardAnimation;
  introPhase: IntroPhase;
  reducedMotion: boolean;
  assemblyClockRef: React.MutableRefObject<number>;
  sharedGeometry: THREE.PlaneGeometry;
  sharedBackTexture: THREE.CanvasTexture;
};

function Card({
  project,
  position,
  index,
  animation,
  introPhase,
  reducedMotion,
  assemblyClockRef,
  sharedGeometry,
  sharedBackTexture,
}: CardProps) {
  const outerRef = useRef<THREE.Group | null>(null);
  const echoRef = useRef<THREE.Mesh | null>(null);
  const echoMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const frontMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const backMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const cardRef = useRef<THREE.Group | null>(null);
  const hovered = useRef(false);
  const frontTexture = useMemo(() => makeFrontTexture(project, index), [project, index]);

  const quaternion = useMemo(() => {
    const normal = new THREE.Vector3(...position).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    if (Math.abs(normal.dot(up)) > 0.96) up.set(0, 0, 1);
    const right = new THREE.Vector3().crossVectors(up, normal).normalize();
    up.crossVectors(normal, right).normalize();
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, normal));
  }, [position]);

  const scratch = useMemo(
    () => ({
      targetVec: new THREE.Vector3(...position),
      pos: new THREE.Vector3(),
      echoPos: new THREE.Vector3(),
      axis: new THREE.Vector3(...animation.swirlAxis).normalize(),
      spinEuler: new THREE.Euler(),
      spinQuat: new THREE.Quaternion(),
      scaleVec: new THREE.Vector3(1, 1, 1),
    }),
    [position, animation.swirlAxis],
  );

  useEffect(() => () => {
    frontTexture.dispose();
  }, [frontTexture]);

  useFrame((_, delta) => {
    const outer = outerRef.current;
    const inner = cardRef.current;
    const echo = echoRef.current;
    const echoMat = echoMatRef.current;
    const frontMat = frontMatRef.current;
    const backMat = backMatRef.current;
    if (!outer || !inner) return;

    if (reducedMotion || introPhase === "complete") {
      outer.visible = true;
      outer.position.copy(scratch.targetVec);
      outer.quaternion.copy(quaternion);
      outer.scale.setScalar(1);
      if (frontMat) frontMat.opacity = 1;
      if (backMat) backMat.opacity = 0.3;
      if (echo) echo.visible = false;
    } else if (introPhase === "waiting-consent") {
      outer.visible = false;
      outer.position.set(0, 0, 0);
      outer.scale.setScalar(0.001);
      if (echo) echo.visible = false;
      return;
    } else {
      const elapsed = assemblyClockRef.current;
      const rawT = (elapsed - animation.delay) / animation.flightDuration;

      if (rawT <= 0) {
        outer.visible = false;
        outer.position.set(0, 0, 0);
        outer.scale.setScalar(0.001);
        if (echo) echo.visible = false;
        return;
      }

      outer.visible = true;

      if (rawT < 1) {
        const radial = easeOutQuint(rawT);
        const orbitAngle = animation.swirlTurns * Math.pow(1 - rawT, 2.1);
        scratch.pos
          .copy(scratch.targetVec)
          .multiplyScalar(radial)
          .applyAxisAngle(scratch.axis, orbitAngle);
        outer.position.copy(scratch.pos);

        const spinDecay = Math.pow(1 - easeOutCubic(rawT), 1.6);
        scratch.spinEuler.set(
          animation.spinAngles[0] * spinDecay,
          animation.spinAngles[1] * spinDecay,
          animation.spinAngles[2] * spinDecay,
        );
        scratch.spinQuat.setFromEuler(scratch.spinEuler);
        outer.quaternion.copy(quaternion).multiply(scratch.spinQuat);

        const reveal = easeOutCubic(Math.min(rawT * 1.9, 1));
        outer.scale.setScalar(0.24 + 0.76 * reveal);
        if (frontMat) frontMat.opacity = reveal;
        if (backMat) backMat.opacity = 0.3 * reveal;

        // Lightweight motion-blur afterimage trailing behind the flying card
        if (echo && echoMat && rawT > 0.04 && rawT < 0.94) {
          const lagT = Math.max(0, rawT - 0.09);
          const lagRadial = easeOutQuint(lagT);
          const lagAngle = animation.swirlTurns * Math.pow(1 - lagT, 2.1);
          scratch.echoPos
            .copy(scratch.targetVec)
            .multiplyScalar(lagRadial)
            .applyAxisAngle(scratch.axis, lagAngle);
          echo.visible = true;
          echo.position.copy(scratch.echoPos);
          echo.quaternion.copy(outer.quaternion);
          echo.scale.setScalar(outer.scale.x * 0.95);
          echoMat.opacity = 0.22 * Math.sin(rawT * Math.PI);
        } else if (echo) {
          echo.visible = false;
        }
      } else {
        outer.position.copy(scratch.targetVec);
        outer.quaternion.copy(quaternion);
        outer.scale.setScalar(1);
        if (frontMat) frontMat.opacity = 1;
        if (backMat) backMat.opacity = 0.3;
        if (echo) echo.visible = false;
      }
    }

    const easing = 1 - Math.exp(-delta * 12);
    const interactive = introPhase === "hero-text" || introPhase === "nav-open" || introPhase === "complete";
    const targetScale = interactive && hovered.current ? 1.09 : 1;
    scratch.scaleVec.set(targetScale, targetScale, 1);
    inner.scale.lerp(scratch.scaleVec, easing);
    inner.position.z = THREE.MathUtils.damp(
      inner.position.z,
      interactive && hovered.current ? 0.055 : 0,
      12,
      delta,
    );
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    if (introPhase !== "hero-text" && introPhase !== "nav-open" && introPhase !== "complete") return;
    event.stopPropagation();
    hovered.current = true;
    document.body.style.cursor = "pointer";
  };
  const handlePointerOut = () => {
    hovered.current = false;
    document.body.style.cursor = "";
  };

  return (
    <>
      <group ref={outerRef} position={position} quaternion={quaternion}>
        <group ref={cardRef}>
          <mesh geometry={sharedGeometry} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
            <meshBasicMaterial ref={frontMatRef} map={frontTexture} side={THREE.FrontSide} transparent alphaTest={0.02} toneMapped={false} />
          </mesh>
          <mesh geometry={sharedGeometry} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
            <meshBasicMaterial ref={backMatRef} map={sharedBackTexture} side={THREE.BackSide} transparent opacity={0.3} alphaTest={0.02} toneMapped={false} />
          </mesh>
        </group>
      </group>
      <mesh ref={echoRef} geometry={sharedGeometry} visible={false}>
        <meshBasicMaterial
          ref={echoMatRef}
          map={frontTexture}
          side={THREE.DoubleSide}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

function SereneMotes({
  glowTexture,
  introPhase,
  reducedMotion,
  assemblyClockRef,
}: {
  glowTexture: THREE.CanvasTexture;
  introPhase: IntroPhase;
  reducedMotion: boolean;
  assemblyClockRef: React.MutableRefObject<number>;
}) {
  const pointsRef = useRef<THREE.Points | null>(null);
  const matRef = useRef<THREE.PointsMaterial | null>(null);

  const geometry = useMemo(() => {
    const rand = makeSeededRandom(9421);
    const count = 44;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const u = rand() * 2 - 1;
      const theta = rand() * Math.PI * 2;
      const r = 2.75 + rand() * 1.15;
      const ring = Math.sqrt(Math.max(0, 1 - u * u));
      positions[i * 3] = Math.cos(theta) * ring * r;
      positions[i * 3 + 1] = u * r;
      positions[i * 3 + 2] = Math.sin(theta) * ring * r;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geom;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    const pts = pointsRef.current;
    const mat = matRef.current;
    if (!pts || !mat) return;

    if (introPhase === "waiting-consent") {
      pts.visible = false;
      return;
    }

    pts.visible = true;
    pts.rotation.y -= delta * 0.055;
    pts.rotation.z += delta * 0.018;

    if (reducedMotion || introPhase === "complete") {
      pts.scale.setScalar(1);
      mat.opacity = 0.22;
    } else if (introPhase === "globe-assembling") {
      const p = THREE.MathUtils.clamp(assemblyClockRef.current / 1.85, 0, 1);
      pts.scale.setScalar(0.15 + 0.85 * easeOutCubic(p));
      mat.opacity = 0.44 * Math.sin(Math.min(p, 0.85) * Math.PI) + 0.16 * p;
    } else {
      mat.opacity = THREE.MathUtils.damp(mat.opacity, 0.22, 3, delta);
      pts.scale.setScalar(THREE.MathUtils.damp(pts.scale.x, 1, 4, delta));
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={matRef}
        map={glowTexture}
        size={0.26}
        transparent
        opacity={0.22}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

const TOTAL_ASSEMBLY_TIME = 2.05;
const DOCK_DURATION = 1.02;

interface LayoutMetrics {
  heroWidth: number;
  heroHeight: number;
  slotOffsetX: number;
  slotOffsetY: number;
  slotWidth: number;
  slotHeight: number;
  entryOffsetX: number;
  entryOffsetY: number;
}

function Globe({
  introPhase,
  reducedMotion,
  heroRef,
  globeSlotRef,
}: {
  introPhase: IntroPhase;
  reducedMotion: boolean;
  heroRef?: React.RefObject<HTMLElement | null>;
  globeSlotRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const motionGroup = useRef<THREE.Group | null>(null);
  const group = useRef<THREE.Group | null>(null);
  const dragGroup = useRef<THREE.Group | null>(null);
  const tilt = useRef<THREE.Group | null>(null);
  const wakeRef = useRef<THREE.Mesh | null>(null);
  const wakeMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const sphereHovered = useRef(false);
  const assemblyClockRef = useRef(0);
  const dockClockRef = useRef(0);
  const prevPosRef = useRef(new THREE.Vector3());
  const posInitializedRef = useRef(false);
  const drag = useInertiaDrag(dragGroup);
  const { gl, viewport } = useThree();

  const [shuffleSeed] = useState(() => Math.floor(Math.random() * 0xffffffff));

  const layoutMetricsRef = useRef<LayoutMetrics | null>(null);

  useEffect(() => {
    const heroEl = heroRef?.current;
    const slotEl = globeSlotRef?.current;
    if (!heroEl || !slotEl) return;

    const measure = () => {
      const heroRect = heroEl.getBoundingClientRect();
      const slotRect = slotEl.getBoundingClientRect();
      if (!heroRect.width || !heroRect.height || !slotRect.width || !slotRect.height) return;
      layoutMetricsRef.current = {
        heroWidth: heroRect.width,
        heroHeight: heroRect.height,
        slotOffsetX: slotRect.left - heroRect.left + slotRect.width / 2,
        slotOffsetY: slotRect.top - heroRect.top + slotRect.height / 2,
        slotWidth: slotRect.width,
        slotHeight: slotRect.height,
        entryOffsetX: heroRect.width / 2,
        entryOffsetY: Math.min(heroRect.height / 2, window.innerHeight / 2),
      };
    };

    const observer = new ResizeObserver(measure);
    observer.observe(heroEl);
    observer.observe(slotEl);
    window.addEventListener("resize", measure, { passive: true });
    measure();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [heroRef, globeSlotRef]);

  const sharedGeometry = useMemo(() => new THREE.PlaneGeometry(1.04, 0.68), []);
  const sharedBackTexture = useMemo(() => makeSharedBackTexture(), []);
  const glowTexture = useMemo(() => makeRadialGlowTexture(), []);

  useEffect(() => () => {
    sharedGeometry.dispose();
    sharedBackTexture.dispose();
    glowTexture.dispose();
  }, [sharedGeometry, sharedBackTexture, glowTexture]);

  useEffect(() => {
    const canvas = gl.domElement;
    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.current.x = THREE.MathUtils.clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1);
      pointer.current.y = THREE.MathUtils.clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1);
    };
    const resetPointer = () => {
      pointer.current.x = 0;
      pointer.current.y = 0;
      sphereHovered.current = false;
      document.body.style.cursor = "";
    };
    canvas.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerleave", resetPointer, { passive: true });
    return () => {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", resetPointer);
    };
  }, [gl]);

  const orbitCards = useMemo(() => {
    const rand = makeSeededRandom(shuffleSeed);
    const order = Array.from({ length: photoUrls.length }, (_, index) => index);
    for (let index = order.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(rand() * (index + 1));
      [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
    }

    const launchOrder = Array.from({ length: photoUrls.length }, (_, index) => index);
    for (let index = launchOrder.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(rand() * (index + 1));
      [launchOrder[index], launchOrder[swapIndex]] = [launchOrder[swapIndex], launchOrder[index]];
    }

    return order.map((photoIndex, index) => {
      const rank = launchOrder[index];
      const pairGroup = Math.floor(rank / 2);
      const delay = pairGroup * 0.044 + (rank % 2) * 0.018;
      const swirlSign = rank % 2 === 0 ? 1 : -1;
      const swirlTurns = swirlSign * (0.7 + rand() * 0.75) * Math.PI;
      const swirlAxis: [number, number, number] = [
        (rand() - 0.5) * 0.55,
        1,
        (rand() - 0.5) * 0.55,
      ];
      const spinAngles: [number, number, number] = [
        (rand() - 0.5) * 1.8 * Math.PI,
        (rand() - 0.5) * 2.4 * Math.PI,
        (rand() - 0.5) * 1.2 * Math.PI,
      ];

      return {
        project: projects[index % projects.length],
        photoIndex,
        animation: {
          delay,
          flightDuration: 0.82,
          swirlTurns,
          swirlAxis,
          spinAngles,
        } satisfies CardAnimation,
      };
    });
  }, [shuffleSeed]);

  const points = useMemo<[number, number, number][]>(() => {
    const rows = [4, 7, 10, 12, 10, 7, 4];
    const latitudes = [1.05, 0.7, 0.35, 0, -0.35, -0.7, -1.05];
    const radius = 2.55;
    const result: [number, number, number][] = [];
    rows.forEach((count, row) => {
      for (let slot = 0; slot < count; slot += 1) {
        const angle = (slot / count) * Math.PI * 2 + (row % 2) * Math.PI / count + 0.12;
        const latitude = latitudes[row];
        const ring = Math.cos(latitude);
        result.push([Math.sin(angle) * ring * radius, Math.sin(latitude) * radius, Math.cos(angle) * ring * radius]);
      }
    });
    result.push([0, radius, 0], [0, -radius, 0]);
    return result;
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const metrics = layoutMetricsRef.current;

    let entryWorldX = 0;
    let entryWorldY = 0;
    let dockWorldX = 0;
    let dockWorldY = 0;
    let restingScale = 1.24;
    let bigScale = 1.72;

    if (metrics) {
      entryWorldX = (metrics.entryOffsetX / metrics.heroWidth - 0.5) * viewport.width;
      entryWorldY = -(metrics.entryOffsetY / metrics.heroHeight - 0.5) * viewport.height;
      dockWorldX = (metrics.slotOffsetX / metrics.heroWidth - 0.5) * viewport.width;
      dockWorldY = -(metrics.slotOffsetY / metrics.heroHeight - 0.5) * viewport.height;

      const slotWidthWorld = (metrics.slotWidth / metrics.heroWidth) * viewport.width;
      const slotHeightWorld = (metrics.slotHeight / metrics.heroHeight) * viewport.height;
      const restingDiameter = Math.min(slotWidthWorld, slotHeightWorld) * 0.78;
      restingScale = THREE.MathUtils.clamp(restingDiameter / (2 * 2.55), 0.78, 1.44);

      const maxCenterDiameter = Math.min(viewport.width * 0.8, viewport.height * 0.82);
      bigScale = Math.min(maxCenterDiameter / (2 * 2.55), restingScale * 1.42);
      if (bigScale < restingScale * 1.24) {
        bigScale = Math.min(maxCenterDiameter / (2 * 2.55), restingScale * 1.28);
      }
    }

    if (introPhase === "waiting-consent") {
      assemblyClockRef.current = 0;
      dockClockRef.current = 0;
      posInitializedRef.current = false;
      if (motionGroup.current) {
        motionGroup.current.position.set(entryWorldX, entryWorldY, -2.2);
        motionGroup.current.scale.setScalar(bigScale * 0.78);
      }
      if (wakeRef.current) wakeRef.current.visible = false;
      return;
    }

    if (introPhase === "complete" || reducedMotion) {
      assemblyClockRef.current = TOTAL_ASSEMBLY_TIME + 1;
      dockClockRef.current = DOCK_DURATION + 1;
    } else if (introPhase === "globe-assembling") {
      assemblyClockRef.current += dt;
      dockClockRef.current = 0;
    } else {
      assemblyClockRef.current += dt;
      dockClockRef.current += dt;
    }

    if (motionGroup.current) {
      if (reducedMotion || introPhase === "complete") {
        motionGroup.current.position.set(dockWorldX, dockWorldY, 0);
        motionGroup.current.scale.setScalar(restingScale);
      } else if (introPhase === "globe-assembling") {
        const assembleProgress = THREE.MathUtils.clamp(assemblyClockRef.current / 1.1, 0, 1);
        const forwardEase = easeOutCubic(assembleProgress);
        motionGroup.current.position.set(
          entryWorldX,
          entryWorldY,
          THREE.MathUtils.lerp(-2.2, 0.35, forwardEase),
        );
        motionGroup.current.scale.setScalar(
          THREE.MathUtils.lerp(bigScale * 0.8, bigScale, forwardEase),
        );
      } else {
        const dockT = THREE.MathUtils.clamp(dockClockRef.current / DOCK_DURATION, 0, 1);
        const dockEase = easeInOutCubic(dockT);
        motionGroup.current.position.set(
          THREE.MathUtils.lerp(entryWorldX, dockWorldX, dockEase),
          THREE.MathUtils.lerp(entryWorldY, dockWorldY, dockEase),
          THREE.MathUtils.lerp(0.35, 0, dockEase),
        );
        motionGroup.current.scale.setScalar(
          THREE.MathUtils.lerp(bigScale, restingScale, dockEase),
        );
      }

      // Luminous motion-blur wake aligned with the globe's travel vector
      if (wakeRef.current && wakeMatRef.current) {
        if (!posInitializedRef.current) {
          prevPosRef.current.copy(motionGroup.current.position);
          posInitializedRef.current = true;
        }
        const vx = (motionGroup.current.position.x - prevPosRef.current.x) / Math.max(dt, 0.008);
        const vy = (motionGroup.current.position.y - prevPosRef.current.y) / Math.max(dt, 0.008);
        const vz = (motionGroup.current.position.z - prevPosRef.current.z) / Math.max(dt, 0.008);
        prevPosRef.current.copy(motionGroup.current.position);

        const speed2D = Math.hypot(vx, vy);
        const totalSpeed = Math.hypot(speed2D, vz);
        const targetOpacity =
          !reducedMotion && introPhase !== "complete"
            ? THREE.MathUtils.clamp(totalSpeed * 0.045, 0, 0.42)
            : 0;

        wakeMatRef.current.opacity = THREE.MathUtils.damp(
          wakeMatRef.current.opacity,
          targetOpacity,
          6,
          dt,
        );

        if (wakeMatRef.current.opacity > 0.008) {
          wakeRef.current.visible = true;
          const stretch = 1 + Math.min(speed2D * 0.06, 0.65);
          wakeRef.current.scale.set(7.6 * stretch, 6.8, 1);
          if (speed2D > 0.05) {
            wakeRef.current.rotation.z = Math.atan2(vy, vx);
          }
        } else {
          wakeRef.current.visible = false;
        }
      }
    }

    if (group.current) {
      const assemblyProgress = THREE.MathUtils.clamp(
        assemblyClockRef.current / TOTAL_ASSEMBLY_TIME,
        0,
        1,
      );

      if (introPhase === "globe-assembling" && !reducedMotion) {
        const spinSpeed = 0.085 + 0.42 * Math.pow(1 - assemblyProgress, 2.1);
        group.current.rotation.y += dt * spinSpeed;
        group.current.rotation.x = Math.sin(assemblyProgress * Math.PI) * 0.07 * (1 - assemblyProgress);
      } else {
        group.current.rotation.y += dt * 0.085;
        group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, 0, 4, dt);
      }
    }

    if (tilt.current) {
      const interactive = introPhase === "hero-text" || introPhase === "nav-open" || introPhase === "complete";
      tilt.current.rotation.x = THREE.MathUtils.damp(
        tilt.current.rotation.x,
        interactive ? -pointer.current.y * 0.075 : 0,
        3,
        dt,
      );
      tilt.current.rotation.y = THREE.MathUtils.damp(
        tilt.current.rotation.y,
        interactive ? pointer.current.x * 0.075 : 0,
        3,
        dt,
      );
    }
  });

  const interactive = introPhase === "hero-text" || introPhase === "nav-open" || introPhase === "complete";
  const interactiveDrag = interactive ? drag : {};

  return (
    <group ref={motionGroup}>
      {/* Motion-blur luminous wake during entry & ease-in-out glide */}
      <mesh ref={wakeRef} position={[0, 0, -0.45]} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={wakeMatRef}
          map={glowTexture}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <group ref={group}>
        <SereneMotes
          glowTexture={glowTexture}
          introPhase={introPhase}
          reducedMotion={reducedMotion}
          assemblyClockRef={assemblyClockRef}
        />
        <group ref={dragGroup} {...interactiveDrag}>
          <group ref={tilt}>
            {/* Invisible sphere hit proxy so grab cursor only activates over the globe */}
            <mesh
              onPointerOver={() => {
                if (!interactive) return;
                sphereHovered.current = true;
                document.body.style.cursor = "grab";
              }}
              onPointerOut={() => {
                sphereHovered.current = false;
                document.body.style.cursor = "";
              }}
              onPointerDown={() => {
                if (!interactive) return;
                document.body.style.cursor = "grabbing";
              }}
              onPointerUp={() => {
                if (!interactive) return;
                document.body.style.cursor = sphereHovered.current ? "grab" : "";
              }}
            >
              <sphereGeometry args={[2.65, 16, 16]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {orbitCards.map((card, index) => (
              <Card
                key={card.photoIndex}
                project={card.project}
                index={card.photoIndex}
                position={points[index]}
                animation={card.animation}
                introPhase={introPhase}
                reducedMotion={reducedMotion}
                assemblyClockRef={assemblyClockRef}
                sharedGeometry={sharedGeometry}
                sharedBackTexture={sharedBackTexture}
              />
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}

export default function ProjectSphereCanvas({
  heroRef,
  globeSlotRef,
}: {
  heroRef?: React.RefObject<HTMLElement | null>;
  globeSlotRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const { phase, reducedMotion, markGlobeReady } = useIntroSequence();

  useEffect(() => {
    markGlobeReady();
  }, [markGlobeReady]);

  const isWaiting = phase === "waiting-consent";
  const interactive = phase === "hero-text" || phase === "nav-open" || phase === "complete";

  return (
    <div
      className={styles.wrap}
      aria-label="Interactive project globe"
      style={{
        pointerEvents: interactive ? "auto" : "none",
      }}
    >
      <Canvas
        className={styles.canvas}
        frameloop={isWaiting ? "demand" : "always"}
        camera={{ position: [0, 0, 11.5], fov: 48 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={1} />
        <Globe
          introPhase={phase}
          reducedMotion={reducedMotion}
          heroRef={heroRef}
          globeSlotRef={globeSlotRef}
        />
      </Canvas>
    </div>
  );
}
