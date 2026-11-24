"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useInertiaDrag } from "@/components/useInertiaDrag";
import { useIntroSequence, type IntroPhase } from "@/components/IntroSequenceProvider";
import styles from "./ProjectSphereCanvas.module.css";

type Palette = [string, string, string];
export type GlobeProject = {
  title: string;
  theme: string;
};

export interface SelectedGlobeCard {
  project: GlobeProject;
  photoIndex: number;
  photoId: number;
  position: [number, number, number];
}

export const globePalettes: Record<string, Palette> = {
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

const projects: GlobeProject[] = [
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

export const pexelsPhotoIds = [
  26311729, 27413514, 671658, 12393620, 34198832, 17007191, 9399127, 11838589, 3218443, 29960817,
  7036091, 30666562, 13172740, 27413515, 14257762, 32045753, 6942460, 5446097, 33314038, 675257,
  14434884, 1274111, 14910369, 17826353, 13291279, 29389340, 18125203, 36520397, 13034833, 12597242,
  33164661, 10967985, 19940222, 35771810, 35315868, 12932105, 8067157, 26508696, 2923526, 36045210,
  28769445, 17622430, 6196079, 5226084, 40695384, 5712837, 15311343, 7741609, 240040, 2599142,
  2858265, 32420917, 6661427, 33931028, 6498997, 17662493,
];
const photoUrls = pexelsPhotoIds.map(
  (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=400`,
);

const TEX_W = 384;
const TEX_H = 252;
const TEX_RADIUS = 34;

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
  backCanvas.width = 192;
  backCanvas.height = 126;
  const backContext = backCanvas.getContext("2d");
  if (!backContext) throw new Error("Unable to create the globe card back canvas");
  backContext.beginPath();
  backContext.roundRect(0, 0, 192, 126, 18);
  backContext.fillStyle = "#d3d2cd";
  backContext.fill();

  const backTexture = new THREE.CanvasTexture(backCanvas);
  backTexture.colorSpace = THREE.SRGBColorSpace;
  backTexture.generateMipmaps = false;
  backTexture.minFilter = THREE.LinearFilter;
  backTexture.magFilter = THREE.LinearFilter;
  return backTexture;
}

function makeFrontTexture(
  project: GlobeProject,
  index: number,
  enqueueUpload: (task: () => void) => void,
): { texture: THREE.CanvasTexture; cancel: () => void } {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to create the globe artwork canvas");

  const colors = globePalettes[project.theme] ?? globePalettes.type;
  context.beginPath();
  context.roundRect(0, 0, TEX_W, TEX_H, TEX_RADIUS);
  context.clip();

  const background = context.createLinearGradient(0, 0, TEX_W, TEX_H);
  background.addColorStop(0, colors[0]);
  background.addColorStop(1, colors[1]);
  context.fillStyle = background;
  context.fillRect(0, 0, TEX_W, TEX_H);

  const sx = TEX_W / 640;
  const sy = TEX_H / 420;
  context.save();
  context.scale(sx, sy);

  if (project.theme === "orb") {
    context.fillStyle = "#f7f5f1";
    context.fillRect(0, 0, 640, 420);
    const gradient = context.createRadialGradient(300, 175, 8, 330, 205, 130);
    gradient.addColorStop(0, "#fff");
    gradient.addColorStop(0.32, "#92a7ff");
    gradient.addColorStop(0.62, "#7554e9");
    gradient.addColorStop(1, "#ef9fba");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(330, 200, 112, 0, Math.PI * 2);
    context.fill();
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
  context.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  let disposed = false;
  const photo = new Image();
  photo.crossOrigin = "anonymous";
  photo.decoding = "async";
  photo.onload = () => {
    if (disposed) return;
    enqueueUpload(() => {
      if (disposed) return;
      context.clearRect(0, 0, TEX_W, TEX_H);
      context.save();
      context.beginPath();
      context.roundRect(0, 0, TEX_W, TEX_H, TEX_RADIUS);
      context.clip();
      const scale = Math.max(TEX_W / photo.width, TEX_H / photo.height);
      const width = photo.width * scale;
      const height = photo.height * scale;
      context.drawImage(photo, (TEX_W - width) / 2, (TEX_H - height) / 2, width, height);
      context.restore();
      texture.needsUpdate = true;
    });
  };
  photo.src = photoUrls[index];

  return {
    texture,
    cancel: () => {
      disposed = true;
      photo.onload = null;
    },
  };
}

type CardAnimation = {
  delay: number;
  flightDuration: number;
  swirlTurns: number;
  swirlAxis: [number, number, number];
  spinAngles: [number, number, number];
};

type CardProps = {
  project: GlobeProject;
  position: [number, number, number];
  index: number;
  animation: CardAnimation;
  introPhase: IntroPhase;
  hasSelection: boolean;
  reducedMotion: boolean;
  assemblyClockRef: React.MutableRefObject<number>;
  sharedGeometry: THREE.PlaneGeometry;
  sharedBackTexture: THREE.CanvasTexture;
  enqueueUpload: (task: () => void) => void;
  onSelect: (card: SelectedGlobeCard) => void;
};

function Card({
  project,
  position,
  index,
  animation,
  introPhase,
  hasSelection,
  reducedMotion,
  assemblyClockRef,
  sharedGeometry,
  sharedBackTexture,
  enqueueUpload,
  onSelect,
}: CardProps) {
  const outerRef = useRef<THREE.Group | null>(null);
  const frontMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const backMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const cardRef = useRef<THREE.Group | null>(null);
  const hovered = useRef(false);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const frontAsset = useMemo(
    () => makeFrontTexture(project, index, enqueueUpload),
    [project, index, enqueueUpload],
  );

  const quaternion = useMemo(() => {
    const normal = new THREE.Vector3(...position).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    if (Math.abs(normal.dot(up)) > 0.96) up.set(0, 0, normal.y > 0 ? -1 : 1);
    const right = new THREE.Vector3().crossVectors(up, normal).normalize();
    up.crossVectors(normal, right).normalize();
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, normal));
  }, [position]);

  const scratch = useMemo(
    () => ({
      targetVec: new THREE.Vector3(...position),
      pos: new THREE.Vector3(),
      axis: new THREE.Vector3(...animation.swirlAxis).normalize(),
      spinEuler: new THREE.Euler(),
      spinQuat: new THREE.Quaternion(),
      scaleVec: new THREE.Vector3(1, 1, 1),
    }),
    [position, animation.swirlAxis],
  );

  useEffect(() => () => {
    frontAsset.cancel();
    frontAsset.texture.dispose();
  }, [frontAsset]);

  useFrame((_, delta) => {
    const outer = outerRef.current;
    const inner = cardRef.current;
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
    } else if (introPhase === "waiting-consent") {
      outer.visible = false;
      outer.position.set(0, 0, 0);
      outer.scale.setScalar(0.001);
      return;
    } else {
      const elapsed = assemblyClockRef.current;
      const rawT = (elapsed - animation.delay) / animation.flightDuration;

      if (rawT <= 0) {
        outer.visible = false;
        outer.position.set(0, 0, 0);
        outer.scale.setScalar(0.001);
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
      } else {
        outer.position.copy(scratch.targetVec);
        outer.quaternion.copy(quaternion);
        outer.scale.setScalar(1);
        if (frontMat) frontMat.opacity = 1;
        if (backMat) backMat.opacity = 0.3;
      }
    }

    const easing = 1 - Math.exp(-delta * 12);
    const interactive =
      !hasSelection &&
      (introPhase === "hero-text" || introPhase === "nav-open" || introPhase === "complete");
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

  const isInteractive =
    !hasSelection &&
    (introPhase === "hero-text" || introPhase === "nav-open" || introPhase === "complete");

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    if (!isInteractive) return;
    event.stopPropagation();
    hovered.current = true;
    document.body.style.cursor = "pointer";
  };
  const handlePointerOut = () => {
    hovered.current = false;
    document.body.style.cursor = "";
  };
  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!isInteractive) return;
    pointerDownPos.current = { x: event.clientX, y: event.clientY };
  };
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!isInteractive) return;
    const down = pointerDownPos.current;
    pointerDownPos.current = null;
    if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) {
      return;
    }
    event.stopPropagation();
    hovered.current = false;
    document.body.style.cursor = "";
    onSelect({
      project,
      photoIndex: index,
      photoId: pexelsPhotoIds[index],
      position,
    });
  };

  return (
    <group ref={outerRef} position={position} quaternion={quaternion}>
      <group ref={cardRef}>
        <mesh
          geometry={sharedGeometry}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onPointerDown={handlePointerDown}
          onClick={handleClick}
        >
          <meshBasicMaterial ref={frontMatRef} map={frontAsset.texture} side={THREE.FrontSide} transparent toneMapped={false} />
        </mesh>
        <mesh
          geometry={sharedGeometry}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onPointerDown={handlePointerDown}
          onClick={handleClick}
        >
          <meshBasicMaterial ref={backMatRef} map={sharedBackTexture} side={THREE.BackSide} transparent opacity={0.3} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

const TOTAL_ASSEMBLY_TIME = 2.05;
const DOCK_DURATION = 1.02;
const RESTING_SCALE = 1.66;
const BIG_SCALE = 2.0;

function Globe({
  introPhase,
  reducedMotion,
  selectedCard,
  onSelectCard,
}: {
  introPhase: IntroPhase;
  reducedMotion: boolean;
  selectedCard: SelectedGlobeCard | null;
  onSelectCard: (card: SelectedGlobeCard) => void;
}) {
  const motionGroup = useRef<THREE.Group | null>(null);
  const group = useRef<THREE.Group | null>(null);
  const dragGroup = useRef<THREE.Group | null>(null);
  const tilt = useRef<THREE.Group | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const sphereHovered = useRef(false);
  const assemblyClockRef = useRef(0);
  const dockClockRef = useRef(0);
  const uploadQueueRef = useRef<(() => void)[]>([]);
  const drag = useInertiaDrag(dragGroup, Boolean(selectedCard));
  const { gl } = useThree();

  const [shuffleSeed] = useState(() => Math.floor(Math.random() * 0xffffffff));

  const enqueueUpload = useMemo(
    () => (task: () => void) => {
      uploadQueueRef.current.push(task);
    },
    [],
  );

  const sharedGeometry = useMemo(() => new THREE.PlaneGeometry(1.04, 0.68), []);
  const sharedBackTexture = useMemo(() => makeSharedBackTexture(), []);

  useEffect(() => () => {
    sharedGeometry.dispose();
    sharedBackTexture.dispose();
  }, [sharedGeometry, sharedBackTexture]);

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
    for (let i = 0; i < 2 && uploadQueueRef.current.length > 0; i += 1) {
      const task = uploadQueueRef.current.shift();
      task?.();
    }

    const dt = Math.min(delta, 0.033);

    if (introPhase === "waiting-consent") {
      assemblyClockRef.current = 0;
      dockClockRef.current = 0;
      if (motionGroup.current) {
        motionGroup.current.position.set(0, 0, -3.6);
        motionGroup.current.scale.setScalar(BIG_SCALE * 0.78);
      }
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
      if (selectedCard) {
        motionGroup.current.position.z = THREE.MathUtils.damp(motionGroup.current.position.z, 0.35, 6, dt);
        const targetScale = reducedMotion ? RESTING_SCALE : BIG_SCALE;
        motionGroup.current.scale.setScalar(
          THREE.MathUtils.damp(motionGroup.current.scale.x, targetScale, 6, dt),
        );
      } else if (reducedMotion) {
        motionGroup.current.position.set(0, 0, 0);
        motionGroup.current.scale.setScalar(RESTING_SCALE);
      } else if (introPhase === "complete") {
        motionGroup.current.position.z = THREE.MathUtils.damp(motionGroup.current.position.z, 0, 5.5, dt);
        motionGroup.current.scale.setScalar(
          THREE.MathUtils.damp(motionGroup.current.scale.x, RESTING_SCALE, 5.5, dt),
        );
      } else if (introPhase === "globe-assembling") {
        const assembleProgress = THREE.MathUtils.clamp(assemblyClockRef.current / 1.15, 0, 1);
        const forwardEase = easeOutCubic(assembleProgress);
        motionGroup.current.position.set(0, 0, THREE.MathUtils.lerp(-3.6, 0.35, forwardEase));
        motionGroup.current.scale.setScalar(
          THREE.MathUtils.lerp(BIG_SCALE * 0.78, BIG_SCALE, forwardEase),
        );
      } else {
        const dockT = THREE.MathUtils.clamp(dockClockRef.current / DOCK_DURATION, 0, 1);
        const dockEase = easeInOutCubic(dockT);
        motionGroup.current.position.set(0, 0, THREE.MathUtils.lerp(0.35, 0, dockEase));
        motionGroup.current.scale.setScalar(
          THREE.MathUtils.lerp(BIG_SCALE, RESTING_SCALE, dockEase),
        );
      }
    }

    if (group.current) {
      if (selectedCard) {
        // Orient the globe directly toward the clicked card and freeze rotation
        const [px, py, pz] = selectedCard.position;
        const distXZ = Math.hypot(px, pz);
        const targetRx = Math.atan2(py, distXZ);
        const rawTargetRy = -Math.atan2(px, pz);
        const twoPi = Math.PI * 2;
        let deltaRy = ((rawTargetRy - group.current.rotation.y) % twoPi + twoPi) % twoPi;
        if (deltaRy > Math.PI) deltaRy -= twoPi;
        const targetRy = group.current.rotation.y + deltaRy;

        group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetRy, 6, dt);
        group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetRx, 6, dt);
      } else {
        const assemblyProgress = THREE.MathUtils.clamp(
          assemblyClockRef.current / TOTAL_ASSEMBLY_TIME,
          0,
          1,
        );

        if (introPhase === "globe-assembling" && !reducedMotion) {
          const spinSpeed = 0.085 + 0.4 * Math.pow(1 - assemblyProgress, 2.1);
          group.current.rotation.y += dt * spinSpeed;
          group.current.rotation.x = Math.sin(assemblyProgress * Math.PI) * 0.06 * (1 - assemblyProgress);
        } else {
          group.current.rotation.y += dt * 0.085;
          group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, 0, 4, dt);
        }
      }
    }

    if (tilt.current) {
      const interactive =
        !selectedCard &&
        (introPhase === "hero-text" || introPhase === "nav-open" || introPhase === "complete");
      tilt.current.rotation.x = THREE.MathUtils.damp(
        tilt.current.rotation.x,
        interactive ? -pointer.current.y * 0.075 : 0,
        3.5,
        dt,
      );
      tilt.current.rotation.y = THREE.MathUtils.damp(
        tilt.current.rotation.y,
        interactive ? pointer.current.x * 0.075 : 0,
        3.5,
        dt,
      );
    }
  });

  const interactive =
    !selectedCard &&
    (introPhase === "hero-text" || introPhase === "nav-open" || introPhase === "complete");
  const interactiveDrag = interactive ? drag : {};

  return (
    <group ref={motionGroup}>
      <group ref={group}>
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
                hasSelection={selectedCard !== null}
                reducedMotion={reducedMotion}
                assemblyClockRef={assemblyClockRef}
                sharedGeometry={sharedGeometry}
                sharedBackTexture={sharedBackTexture}
                enqueueUpload={enqueueUpload}
                onSelect={onSelectCard}
              />
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}

export default function ProjectSphereCanvas({
  selectedCard = null,
  onSelectCard,
}: {
  selectedCard?: SelectedGlobeCard | null;
  onSelectCard?: (card: SelectedGlobeCard) => void;
}) {
  const { phase, reducedMotion, markGlobeReady } = useIntroSequence();

  useEffect(() => {
    markGlobeReady();
  }, [markGlobeReady]);

  const isWaiting = phase === "waiting-consent";
  const interactive =
    !selectedCard &&
    (phase === "hero-text" || phase === "nav-open" || phase === "complete");

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
        resize={{ scroll: false }}
        camera={{ position: [0, 0, 15.4], fov: 48 }}
        dpr={[1, 1.25]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={1} />
        <Globe
          introPhase={phase}
          reducedMotion={reducedMotion}
          selectedCard={selectedCard}
          onSelectCard={(card) => onSelectCard?.(card)}
        />
      </Canvas>
    </div>
  );
}
