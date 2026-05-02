import { describe, it, expect } from 'vitest';
import { svgCoords } from './coords';

describe('svgCoords', () => {
  it('puts the origin at the center', () => {
    const c = svgCoords(280, 25);
    expect(c.x(0)).toBe(140);
    expect(c.y(0)).toBe(140);
  });

  it('maps positive math y to lower SVG y (axis flip)', () => {
    const c = svgCoords(280, 25);
    expect(c.y(2)).toBe(140 - 50); // center - v*scale
  });

  it('maps positive math x to higher SVG x', () => {
    const c = svgCoords(280, 25);
    expect(c.x(2)).toBe(140 + 50);
  });

  it('uses defaults of size=280 scale=25', () => {
    const c = svgCoords();
    expect(c.size).toBe(280);
    expect(c.center).toBe(140);
    expect(c.scale).toBe(25);
  });
});
