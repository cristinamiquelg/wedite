// Two polygons with the same number of points — a four-pointed star (the Wedite sparkle) and a circle —
// so CSS can morph one into the other with `clip-path` (it interpolates between polygons that have as many
// vertices). Every vertex sits on a ray from the centre, so the star outline is sampled at the same angles
// as the circle's points.

const POINTS = 40;
const OUTER = 50; // percent of the box: the tips touch its edges
const INNER = 15; // how deep the star's waist goes

type Pt = [number, number];

// The star's own outline: eight vertices, tips at the top, right, bottom and left.
const starOutline: Pt[] = Array.from({ length: 8 }, (_, i) => {
  const angle = (-90 + i * 45) * (Math.PI / 180);
  const r = i % 2 === 0 ? OUTER : INNER;
  return [r * Math.cos(angle), r * Math.sin(angle)];
});

/** Distance from the centre to the star's outline along the ray at `angle`. */
function starRadius(angle: number): number {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = 0;
  for (let i = 0; i < starOutline.length; i++) {
    const [x1, y1] = starOutline[i];
    const [x2, y2] = starOutline[(i + 1) % starOutline.length];
    // Solve (dx, dy) * t = (x1, y1) + (x2 - x1, y2 - y1) * u for t >= 0 and u in [0, 1].
    const ex = x2 - x1;
    const ey = y2 - y1;
    const det = dx * -ey - dy * -ex;
    if (Math.abs(det) < 1e-9) continue;
    const t = (x1 * -ey - y1 * -ex) / det;
    const u = (dx * y1 - dy * x1) / det;
    if (t > 0 && u >= -1e-9 && u <= 1 + 1e-9) best = Math.max(best, t);
  }
  return best;
}

function polygon(radiusAt: (angle: number) => number): string {
  const points = Array.from({ length: POINTS }, (_, i) => {
    const angle = (-90 + (i * 360) / POINTS) * (Math.PI / 180);
    const r = radiusAt(angle);
    return `${(50 + r * Math.cos(angle)).toFixed(2)}% ${(50 + r * Math.sin(angle)).toFixed(2)}%`;
  });
  return `polygon(${points.join(", ")})`;
}

export const STAR_POLYGON = polygon(starRadius);
export const CIRCLE_POLYGON = polygon(() => OUTER);
