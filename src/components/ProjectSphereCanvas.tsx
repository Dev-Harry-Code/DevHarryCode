"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useInertiaDrag } from "@/components/useInertiaDrag";
import styles from "./ProjectSphereCanvas.module.css";

type Palette = [string, string, string];
type Project = {
  title: string;
  theme: string;
};
type Artwork = {
  texture: THREE.CanvasTexture;
  backTexture: THREE.CanvasTexture;
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
  (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=900`,
);

function makeArtwork(project: Project, index: number): Artwork {
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
    context.shadowBlur = 38;
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

  const backCanvas = document.createElement("canvas");
  backCanvas.width = 640;
  backCanvas.height = 420;
  const backContext = backCanvas.getContext("2d");
  if (!backContext) throw new Error("Unable to create the globe card back canvas");
  backContext.beginPath();
  backContext.roundRect(0, 0, 640, 420, 58);
  backContext.fillStyle = "#d3d2cd";
  backContext.fill();

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

  const backTexture = new THREE.CanvasTexture(backCanvas);
  backTexture.colorSpace = THREE.SRGBColorSpace;
  backTexture.anisotropy = 4;
  return { texture, backTexture };
}

type CardProps = {
  project: Project;
  position: [number, number, number];
  index: number;
};

function Card({ project, position, index }: CardProps) {
  const cardRef = useRef<THREE.Group | null>(null);
  const hovered = useRef(false);
  const artwork = useMemo(() => makeArtwork(project, index), [project, index]);
  const quaternion = useMemo(() => {
    const normal = new THREE.Vector3(...position).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    if (Math.abs(normal.dot(up)) > 0.96) up.set(0, 0, 1);
    const right = new THREE.Vector3().crossVectors(up, normal).normalize();
    up.crossVectors(normal, right).normalize();
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, normal));
  }, [position]);

  useEffect(() => () => {
    artwork.texture.dispose();
    artwork.backTexture.dispose();
  }, [artwork]);

  useFrame((_, delta) => {
    if (!cardRef.current) return;
    const easing = 1 - Math.exp(-delta * 12);
    const targetScale = hovered.current ? 1.09 : 1;
    cardRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, 1), easing);
    cardRef.current.position.z = THREE.MathUtils.damp(cardRef.current.position.z, hovered.current ? 0.055 : 0, 12, delta);
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    hovered.current = true;
    document.body.style.cursor = "pointer";
  };
  const handlePointerOut = () => {
    hovered.current = false;
    document.body.style.cursor = "";
  };

  return (
    <group position={position} quaternion={quaternion}>
      <group ref={cardRef}>
        <mesh onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
          <planeGeometry args={[1.04, 0.68]} />
          <meshBasicMaterial map={artwork.texture} side={THREE.FrontSide} transparent alphaTest={0.02} toneMapped={false} />
        </mesh>
        <mesh onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
          <planeGeometry args={[1.04, 0.68]} />
          <meshBasicMaterial map={artwork.backTexture} side={THREE.BackSide} transparent opacity={0.3} alphaTest={0.02} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function Globe() {
  const group = useRef<THREE.Group | null>(null);
  const dragGroup = useRef<THREE.Group | null>(null);
  const tilt = useRef<THREE.Group | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const drag = useInertiaDrag(dragGroup);
  const { gl } = useThree();

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
    };
    canvas.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerleave", resetPointer, { passive: true });
    return () => {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", resetPointer);
    };
  }, [gl]);

  const orbitCards = useMemo(() => {
    const order = Array.from({ length: photoUrls.length }, (_, index) => index);
    let seed = 78321;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let index = order.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
    }
    return order.map((photoIndex, index) => ({ project: projects[index % projects.length], photoIndex }));
  }, []);

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
    if (group.current) {
      group.current.rotation.y += delta * 0.1;
      const targetScale = 1.5;
      const scale = THREE.MathUtils.damp(group.current.scale.x, targetScale, 4, delta);
      group.current.scale.setScalar(scale);
    }
    if (tilt.current) {
      tilt.current.rotation.x = THREE.MathUtils.damp(tilt.current.rotation.x, -pointer.current.y * 0.08, 3, delta);
      tilt.current.rotation.y = THREE.MathUtils.damp(tilt.current.rotation.y, pointer.current.x * 0.08, 3, delta);
    }
  });

  return (
    <group ref={group}>
      <group ref={dragGroup} {...drag}>
        <group ref={tilt}>
          {orbitCards.map((card, index) => <Card key={card.photoIndex} project={card.project} index={card.photoIndex} position={points[index]} />)}
        </group>
      </group>
    </group>
  );
}

export default function ProjectSphereCanvas() {
  return (
    <div className={styles.wrap} aria-label="Interactive project globe">
      <Canvas className={styles.canvas} camera={{ position: [0, 0, 10], fov: 52 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={1} />
        <Globe />
      </Canvas>
    </div>
  );
}
