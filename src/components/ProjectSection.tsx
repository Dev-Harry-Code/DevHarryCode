"use client";
import React, { useRef, useState, useMemo } from 'react';
import { useShaderExclude } from "@/components/ShaderExcludeContext";
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import type { TargetAndTransition } from 'framer-motion';
import { ExternalLink, ArrowUpRight, X } from 'lucide-react';
import { FaGithub as Github } from 'react-icons/fa';

export interface Project {
  id: number;
  title: string;
  category: string;
  description: string;
  fullDetails: string;
  tags: string[];
  imageUrl: string;
  githubUrl?: string;
  liveUrl?: string;
  bentoSpan: string;
  hoverVariant: 'tilt' | 'borderPulse' | 'verticalLift' | 'scaleRotate' | 'colorSweep';
}

const PROJECTS: Project[] = [
  {
    id: 1,
    title: 'Neural Vision Engine',
    category: 'AI / Machine Learning',
    description: 'Real-time predictive computer vision framework running at sub-10ms neural inferencing time.',
    fullDetails: 'Engineered a real-time computer vision pipeline utilizing WebGL and WebGPU bindings. Processes up to 120 FPS camera feeds locally in-browser with sub-10ms neural inferencing time.',
    tags: ['WebGPU', 'TypeScript', 'TensorFlow.js', 'Three.js'],
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
    githubUrl: 'https://github.com',
    liveUrl: 'https://example.com',
    bentoSpan: 'col-span-12 lg:col-span-8 row-span-2',
    hoverVariant: 'tilt',
  },
  {
    id: 2,
    title: 'Aetherium Protocol',
    category: 'Web3 & Security',
    description: 'Decentralized identity verification powered by zero-knowledge cryptographic proofs.',
    fullDetails: 'A Privacy-first Web3 authentication kit enabling zero-knowledge identity validation across multi-chain ecosystems without leaking private user metrics.',
    tags: ['Solidity', 'ZK-SNARKs', 'Next.js', 'Ethers.js'],
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1000&auto=format&fit=crop',
    githubUrl: 'https://github.com',
    liveUrl: 'https://example.com',
    bentoSpan: 'col-span-12 lg:col-span-4 row-span-1',
    hoverVariant: 'borderPulse',
  },
  {
    id: 3,
    title: 'Chronos Design System',
    category: 'UI / UX Framework',
    description: 'High-density component library tailored for fast financial dashboards.',
    fullDetails: 'An ultra-lightweight UI system built on Tailwind CSS and Radix Primitives, optimized for canvas rendering, live websocket streams, and heavy state updates.',
    tags: ['React', 'TailwindCSS', 'Radix UI', 'Storybook'],
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop',
    githubUrl: 'https://github.com',
    liveUrl: 'https://example.com',
    bentoSpan: 'col-span-12 md:col-span-6 lg:col-span-4 row-span-1',
    hoverVariant: 'verticalLift',
  },
  {
    id: 4,
    title: 'Vortex Audio Synthesizer',
    category: 'WebAudio & WASM',
    description: 'Spatial 3D audio synthesizer and visualizer compiled inside WebAssembly.',
    fullDetails: 'Leverages C++ compiled into WebAssembly for digital signal processing (DSP), coupled with Three.js node visualizers for spatial 3D audio graph representation.',
    tags: ['WebAssembly', 'C++', 'WebAudio API', 'Three.js'],
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000&auto=format&fit=crop',
    githubUrl: 'https://github.com',
    liveUrl: 'https://example.com',
    bentoSpan: 'col-span-12 md:col-span-6 lg:col-span-6 row-span-1',
    hoverVariant: 'scaleRotate',
  },
  {
    id: 5,
    title: 'Solstice Generative Engine',
    category: 'Generative Art',
    description: 'Algorithmic artwork generator driven by dynamic user interaction and physical simulation.',
    fullDetails: 'An interactive canvas generator using fluid dynamics and custom GLSL fragment shaders to synthesize organic visual outputs downloadable in vector formats.',
    tags: ['GLSL', 'Canvas API', 'Math Physics', 'React'],
    imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1000&auto=format&fit=crop',
    githubUrl: 'https://github.com',
    liveUrl: 'https://example.com',
    bentoSpan: 'col-span-12 lg:col-span-6 row-span-1',
    hoverVariant: 'colorSweep',
  },
];

const ShaderPlane: React.FC<{ targetMouse: React.MutableRefObject<THREE.Vector2> }> = ({ targetMouse }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport, size } = useThree();

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(size.width, size.height) },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    }),
    [size]
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.u_mouse.value.lerp(targetMouse.current, 0.35);
    mat.uniforms.u_time.value = state.clock.getElapsedTime();
    mat.uniforms.u_resolution.value.set(size.width, size.height);
  });

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_time;
    varying vec2 vUv;

    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      st.x *= u_resolution.x / u_resolution.y;
      
      vec2 m = u_mouse;
      m.x *= u_resolution.x / u_resolution.y;

      float gridSize = 32.0;
      vec2 gridUv = fract(st * gridSize);
      vec2 gridId = floor(st * gridSize);

      vec2 tileCenter = (gridId + 0.5) / gridSize;
      float dist = distance(tileCenter, m);

      float intensity = pow(smoothstep(0.35, 0.0, dist), 1.8);
      float border = step(0.03, gridUv.x) * step(0.03, gridUv.y) * step(gridUv.x, 0.97) * step(gridUv.y, 0.97);
      
      vec3 baseColor = vec3(0.02, 0.02, 0.05);
      vec3 activeColor = vec3(0.5, 0.65, 1.0); 

      vec3 finalColor = mix(baseColor, activeColor, intensity * 0.8);
      float alpha = (1.0 - border) * 0.08 + intensity * 0.35;

      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
};

export const ProjectSection: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const projectRef = useShaderExclude<HTMLDivElement>("projectRef");
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    targetMouse.current.set(x, y);
  };

  return (
    <section 
      onPointerMove={handlePointerMove}
      className="dark relative min-h-screen w-full bg-[#030303] text-foreground py-20 px-6 select-none [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] [WebkitMaskImage:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
    >
      <div ref={projectRef} className="absolute inset-0 pointer-events-none z-0">
        <Canvas camera={{ position: [0, 0, 1] }} gl={{ alpha: true }}>
          <ShaderPlane targetMouse={targetMouse} />
        </Canvas>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3"
          >
            Featured Works
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-xl"
          >
            An interactive bento showcase styled with liquid glass elements and WebGL dynamics.
          </motion.p>
        </div>

        <div className="grid grid-cols-12 gap-6 auto-rows-[280px]">
          {PROJECTS.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              onSelect={() => setSelectedProject(project)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedProject && (
          <Modal project={selectedProject} onClose={() => setSelectedProject(null)} />
        )}
      </AnimatePresence>
    </section>
  );
};

interface CardProps {
  project: Project;
  index: number;
  onSelect: () => void;
}

const ProjectCard: React.FC<CardProps> = ({ project, index, onSelect }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isTiltCard = project.hoverVariant === 'tilt';

  // High-performance hardware accelerated Framer Motion Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for fluid, physical tilt motion
  const rotateX = useSpring(useMotionValue(0), { stiffness: 300, damping: 25 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 300, damping: 25 });

  // Dynamic radial gradient background evaluated purely on GPU layer
  const glowBg = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, rgba(255, 255, 255, 0.18), transparent 80%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTiltCard || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseX.set(x);
    mouseY.set(y);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    rotateX.set(((y - centerY) / centerY) * -12);
    rotateY.set(((x - centerX) / centerX) * 12);
  };

  const handleMouseLeave = () => {
    if (!isTiltCard) return;
    rotateX.set(0);
    rotateY.set(0);
  };

  const getHoverAnimation = (): TargetAndTransition => {
    switch (project.hoverVariant) {
      case 'verticalLift':
        return { y: -8, transition: { duration: 0.25 } };
      case 'scaleRotate':
        return { scale: 1.02, rotate: 0.5, transition: { duration: 0.25 } };
      default:
        return {};
    }
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onSelect}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      whileHover={getHoverAnimation()}
      style={{
        rotateX: isTiltCard ? rotateX : 0,
        rotateY: isTiltCard ? rotateY : 0,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className={`
        ${project.bentoSpan}
        liquid-glass-3d
        relative group cursor-pointer rounded-2xl
        backdrop-blur-xl flex flex-col justify-between
        transition-shadow duration-300 ease-out
        ${isTiltCard ? 'hover:shadow-[0_30px_60px_rgba(0,0,0,0.9),0_0_50px_rgba(255,255,255,0.15)]' : 'overflow-hidden'}
        ${project.hoverVariant === 'borderPulse' ? 'hover:border-primary/60 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]' : ''}
      `}
    >
      <div 
        className="absolute inset-0 z-0 rounded-2xl overflow-hidden transition-transform duration-500 ease-out group-hover:[transform:translateZ(-20px)]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <img
          src={project.imageUrl}
          alt={project.title}
          className="w-full h-full object-cover object-center opacity-25 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/80 to-transparent" />
      </div>

      {isTiltCard && (
        <motion.div
          className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl z-10 [transform:translateZ(10px)]"
          style={{ background: glowBg }}
        />
      )}

      {project.hoverVariant === 'colorSweep' && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10 rounded-2xl" />
      )}

      <div 
        className="relative z-20 p-6 flex items-center justify-between transition-transform duration-500 ease-out group-hover:[transform:translateZ(50px)]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80 border border-border/40 bg-secondary/30 backdrop-blur-md rounded-full px-3 py-1 shadow-md">
          {project.category}
        </span>
        
        <div 
          className="p-2.5 rounded-full text-foreground bg-white/10 border border-white/20 backdrop-blur-md transition-all duration-500 ease-out group-hover:[transform:translateZ(40px)_scale(1.2)] group-hover:bg-white group-hover:text-black magnetic-btn-glow"
        >
          <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>

      <div 
        className="relative z-20 p-6 pt-0 transition-transform duration-500 ease-out group-hover:[transform:translateZ(70px)]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-white transition-colors drop-shadow-lg">
          {project.title}
        </h3>

        <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2 drop-shadow-md">
          {project.description}
        </p>

        <div 
          className="flex flex-wrap gap-2 transition-transform duration-500 ease-out group-hover:[transform:translateZ(25px)]"
        >
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-full text-muted-foreground border border-border/30 bg-secondary/20 backdrop-blur-md shadow-md"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

interface ModalProps {
  project: Project;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ project, onClose }) => {
  return (
    <div className="dark fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="liquid-glass-3d relative z-10 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl backdrop-blur-2xl"
      >
        <div className="relative h-48 w-full overflow-hidden">
          <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/50 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 pt-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80 border border-border/40 bg-secondary/30 backdrop-blur-md rounded-full px-3 py-1">
            {project.category}
          </span>

          <h3 className="text-3xl font-bold text-foreground mt-3 mb-4">{project.title}</h3>

          <p className="text-muted-foreground text-base leading-relaxed mb-6">
            {project.fullDetails}
          </p>

          <div className="flex flex-wrap gap-2 mb-8">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1.5 rounded-full text-foreground border border-border/40 bg-secondary/30"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/30 bg-white text-black font-semibold text-sm hover:scale-105 transition-transform"
              >
                <ExternalLink className="w-4 h-4" /> Live Demo
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
              >
                <Github className="w-4 h-4" /> Source Code
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectSection;