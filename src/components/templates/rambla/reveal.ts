import type { CSSProperties } from "react";

// Marks one piece of the page to fade in (and rise a little) when it reaches the screen while scrolling. The shared
// ScrollReveal observer adds `is-visible` to anything with `data-reveal`; rambla.module.css does the animation.
// `i` is the piece's place in its group (0, 1, 2…): each one starts a beat after the previous, so a group
// (the countdown, a row of cards, a form) appears one piece after another instead of all at once.
export function rv(i = 0): { "data-reveal": string; style: CSSProperties } {
  return { "data-reveal": "item", style: { "--rv-i": Math.min(i, 5) } as CSSProperties };
}
