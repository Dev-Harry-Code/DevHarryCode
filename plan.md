# Reusable Animated Dotted Mesh Section Background

## Summary

The portfolio now includes a reusable `DotMeshBackground` client component inspired by the animated dotted hero background on [WinUtil](https://winutil.christitus.com/). It is intended to sit behind future section content without changing the existing global `MouseShader`.

## Usage

```tsx
<section className="relative isolate overflow-hidden">
  <DotMeshBackground />
  <div className="relative z-10">
    {/* future portfolio section content */}
  </div>
</section>
```

Import it with:

```tsx
import DotMeshBackground from "@/components/DotMeshBackground";
```

## Behavior

- Uses a responsive 2D canvas grid of softly glowing blue dots.
- Adds subtle idle drift, pointer proximity brightness/size/displacement, fast-pointer emphasis, and bounded click ripples.
- Keeps the canvas non-interactive so content above it remains clickable.
- Resizes with `ResizeObserver` and caps device-pixel ratio at `1.5`.
- Pauses drawing when the section is outside the viewport or the document is hidden.
- Disables animated interaction when `prefers-reduced-motion` is enabled.
- Touch input keeps the background passive and avoids continuous pointer tracking.

## Verification

Run `pnpm lint` and `pnpm build`. Check desktop pointer movement, pointer exit, click ripples, touch behavior, resizing, reduced motion, and coexistence with the existing global liquid shader.
