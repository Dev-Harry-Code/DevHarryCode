"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import styles from "./InfiniteProfileCarousel.module.css";

const images = [
  { src: "/profile.jpg", alt: "Harshal Sharma" },
  { src: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=85", alt: "Circuit board" },
  { src: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=700&q=85", alt: "Code on a screen" },
  { src: "/profile.jpg", alt: "Harshal Sharma" },
  { src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=700&q=85", alt: "Developer workspace" },
  { src: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=700&q=85", alt: "Programming code" },
  { src: "/profile.jpg", alt: "Harshal Sharma" },
  { src: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=700&q=85", alt: "Developer writing code" },
  { src: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=700&q=85", alt: "Laptop and code" },
  { src: "/profile.jpg", alt: "Harshal Sharma" },
  { src: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=700&q=85", alt: "Terminal code" },
  { src: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=700&q=85", alt: "Laptop workspace" },
  { src: "/profile.jpg", alt: "Harshal Sharma" },
  { src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=700&q=85", alt: "Retro computer hardware" },
  { src: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=700&q=85", alt: "Artificial intelligence concept" },
];

const STEP = 360 / images.length;
const floatDurations = [7.2, 8.6, 6.9, 9.4, 7.8, 10.1, 8.1, 6.7, 9.8, 7.5, 8.9, 10.4, 7.1, 9.1, 8.3];
const floatDelays = [0, -2.4, -4.1, -1.2, -5.3, -3.5, -6.2, -1.8, -4.8, -2.9, -5.9, -.8, -3.9, -6.7, -2.1];

export default function InfiniteProfileCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const wheelLock = useRef(false);

  const move = (direction: 1 | -1) => {
    setActiveIndex((current) => (current + direction + images.length) % images.length);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) < 8) return;
    event.preventDefault();
    if (wheelLock.current) return;
    wheelLock.current = true;
    move(event.deltaY > 0 ? 1 : -1);
    window.setTimeout(() => { wheelLock.current = false; }, 460);
  };

  const cards = useMemo(() => images.map((image, index) => ({ ...image, index })), []);

  return (
    <div className={styles.wrap} onWheel={handleWheel}>
      <div className={styles.stage} aria-label="Revolving profile image gallery">
        <div className={styles.barrel} style={{ transform: `rotateY(${-activeIndex * STEP}deg)` }}>
          {cards.map((image) => (
            <button
              type="button"
              key={`${image.src}-${image.index}`}
              className={`${styles.card} ${image.index === activeIndex ? styles.active : ""}`}
              onClick={() => setActiveIndex(image.index)}
              aria-label={`Bring ${image.alt} to the front`}
              style={{ "--card-angle": `${image.index * STEP}deg`, "--float-duration": `${floatDurations[image.index]}s`, "--float-delay": `${floatDelays[image.index]}s`, "--float-distance": `${3 + (image.index % 3)}px` } as CSSProperties}
            >
              <img src={image.src} alt={image.alt} draggable={false} />
              <span className={styles.scanline} aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className={styles.orbit} aria-hidden="true" />
      </div>
    </div>
  );
}
