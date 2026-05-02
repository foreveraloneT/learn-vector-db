/**
 * Coordinate transform for 2D math demos rendered in SVG.
 *
 * Math convention: origin at center, +y up.
 * SVG convention: origin at top-left, +y down.
 *
 * `x(v)` and `y(v)` map a math coordinate to its SVG pixel position.
 */
export interface SvgCoords {
  size: number;
  center: number;
  scale: number;
  x: (v: number) => number;
  y: (v: number) => number;
}

export function svgCoords(size = 280, scale = 25): SvgCoords {
  const center = size / 2;
  return {
    size,
    center,
    scale,
    x: (v) => center + v * scale,
    y: (v) => center - v * scale,
  };
}
