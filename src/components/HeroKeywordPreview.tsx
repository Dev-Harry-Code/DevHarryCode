export type HeroKeyword = "MaTriX" | "programmer";

const definitions: Record<HeroKeyword, { label: string; title: string; lines: string[] }> = {
  MaTriX: {
    label: "MATHEMATICS / CONCEPT",
    title: "Matrix",
    lines: [
      "A rectangular array of numbers or other mathematical objects.",
      "Its entries are arranged in rows and columns.",
    ],
  },
  programmer: {
    label: "COMPUTING / ROLE",
    title: "Programmer",
    lines: [
      "An author of computer source code.",
      "Also called a coder or software developer.",
    ],
  },
};

interface HeroKeywordPreviewProps {
  keyword: HeroKeyword;
  x: number;
  y: number;
}

export default function HeroKeywordPreview({ keyword, x, y }: HeroKeywordPreviewProps) {
  const definition = definitions[keyword];

  return (
    <aside
      className="pointer-events-none fixed z-50 w-64 border border-white/20 bg-[#070b16]/95 px-4 py-3 text-white shadow-2xl backdrop-blur-xl sm:w-72"
      style={{ left: `${x}px`, top: `${y}px` }}
      aria-hidden="true"
    >
      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-200/65">{definition.label}</p>
      <p className="mb-1 font-serif text-lg italic text-white/95">{definition.title}</p>
      <p className="text-xs leading-5 text-white/65">{definition.lines[0]}<br />{definition.lines[1]}</p>
    </aside>
  );
}
