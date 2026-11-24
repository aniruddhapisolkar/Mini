import { describe, it, expect } from "vitest";
import { transformPoint, rectUnion, distance, lerp, clamp } from "../MiniRender/geometry/index";

describe("geometry", () => {
  it("transforms a point", () => {
    const t = { a: 2, b: 0, c: 0, d: 2, e: 10, f: 5 };
    expect(transformPoint(t, { x: 1, y: 2 })).toEqual({ x: 12, y: 9 });
  });
  it("unions rects", () => {
    const r = rectUnion({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 });
    expect(r).toEqual({ x: 0, y: 0, width: 15, height: 15 });
  });
  it("clamps", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});
