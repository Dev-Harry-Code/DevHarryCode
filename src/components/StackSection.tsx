import type { CSSProperties } from "react";
import styles from "./StackSection.module.css";

const images = [
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=80&sat=-20",
];

const branding = ["D", "E", "V", "H", "A", "R", "R", "Y", "C", "O", "D", "E"];

export default function StackSection() {
  return (
    <section id="stack" className={styles.section} aria-label="Selected stack imagery">
      <nav
        className={styles.gallery}
        style={{ "--max-p": images.length, "--max-z": 9 } as CSSProperties}
        aria-label="Stack gallery"
      >
        {images.map((image, index) => (
          <a
            key={`${image}-${index}`}
            href="#stack"
            className={styles.panel}
            style={{ "--i": index, "--img": `url("${image}")` } as CSSProperties}
            aria-label={`Gallery image ${index + 1}`}
          >
            <span className={styles.image} aria-hidden="true" />
            <span className={styles.brandChar} aria-hidden="true">{branding[index]}</span>
            <span className={styles.hoverZone} aria-hidden="true">
              {Array.from({ length: 9 }, (_, zone) => <i key={zone} />)}
            </span>
          </a>
        ))}
      </nav>
    </section>
  );
}
