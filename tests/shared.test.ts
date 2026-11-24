import { describe, it, expect } from "vitest";
import {
  point, size, rect, addPoints, distance, transformPoint, multiplyTransforms, invertTransform,
  rectContains, rectUnion, rectIntersection, lerp, clamp,
} from "../MiniRender/geometry/index.js";
import { TextProcessor, Typography, sanitizeHtml, CanvasTextMeasurer, createSpan } from "../MiniRender/text/index.js";
import {
  DefaultResourceManager, DefaultCache, DefaultDiagnostics, DefaultScheduler,
  createRenderHandle, register, hasModule, getModule, resolveBackend,
} from "../MiniRender/index.js";
import { htmlBackend, svgBackend } from "../MiniRender/index.js";

describe("MiniRender Phase 1 Shared Tests", () => {
  // Geometry
  it("geometry: point operations", () => {
    const p = point(3, 4);
    expect(p.x).toBe(3);
    expect(distance(point(0, 0), point(3, 4))).toBe(5);
    expect(addPoints(point(1, 2), point(3, 4))).toEqual({ x: 4, y: 6 });
  });

  it("geometry: transform", () => {
    const t = { a: 2, b: 0, c: 0, d: 2, e: 10, f: 20 };
    const p = transformPoint(t, { x: 1, y: 2 });
    expect(p.x).toBe(12);
    expect(p.y).toBe(24);
  });

  it("geometry: rect operations", () => {
    const r = rect(0, 0, 10, 20);
    expect(rectContains(r, point(5, 10))).toBe(true);
    expect(rectContains(r, point(15, 10))).toBe(false);
    const u = rectUnion(rect(0, 0, 10, 10), rect(5, 5, 10, 10));
    expect(u).toEqual({ x: 0, y: 0, width: 15, height: 15 });
  });

  it("geometry: lerp and clamp", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("geometry: invert transform", () => {
    const t = { a: 2, b: 0, c: 0, d: 2, e: 10, f: 20 };
    const inv = invertTransform(t);
    const p = transformPoint(inv, transformPoint(t, point(3, 4)));
    expect(p.x).toBeCloseTo(3);
    expect(p.y).toBeCloseTo(4);
  });

  // Text processing
  it("text: TextProcessor", () => {
    const result = TextProcessor.process("  Hello   World  ", { collapseWhitespace: true, trim: true });
    expect(result).toBe("Hello World");
  });

  it("text: sanitizeHtml", () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain("script");
    expect(output).toContain("Hello");
  });

  it("text: Typography", () => {
    const result = Typography.apply("Hello... world--", { ellipsis: true, dashes: true });
    expect(result).toContain("…");
  });

  it("text: createSpan", () => {
    const span = createSpan("hello", "keyword", 0, 5);
    expect(span.text).toBe("hello");
    expect(span.kind).toBe("keyword");
    expect(span.range).toEqual([0, 5]);
  });

  // Lifecycle
  it("lifecycle: resource manager", () => {
    const rm = new DefaultResourceManager();
    const r = rm.acquire("font", "font", "render");
    expect(r.refCount).toBe(1);
    rm.release("font");
    expect(rm.get("font")).toBeUndefined();
  });

  it("lifecycle: cache with TTL", () => {
    const cache = new DefaultCache();
    cache.set("key", 42, 10000);
    expect(cache.get("key")).toBe(42);
    cache.delete("key");
    expect(cache.has("key")).toBe(false);
  });

  it("lifecycle: diagnostics", () => {
    const diag = new DefaultDiagnostics();
    diag.emit({ level: "error", code: "TEST", message: "test error" });
    expect(diag.list().length).toBe(1);
    expect(diag.list().filter((d: any) => d.level === "error").length).toBe(1);
  });

  it("lifecycle: render handle", () => {
    let destroyed = false;
    const handle = createRenderHandle("math", { id: "test", kind: "math" } as any, () => {}, () => { destroyed = true; });
    expect(handle.id).toBeTruthy();
    handle.destroy();
    expect(destroyed).toBe(true);
  });

  // Registry
  it("registry: module registration", () => {
    const descriptor = {
      id: "chart" as const,
      name: "MiniChart",
      version: "0.1.0",
      capabilities: ["render:html" as const],
      supportedBackends: ["html" as const],
      parse: () => ({ kind: "chart" as const, version: 1 }),
      render: () => ({ handle: createRenderHandle("chart", { id: "r", kind: "chart" } as any, () => {}, () => {}) }),
    };
    register(descriptor);
    expect(hasModule("chart")).toBe(true);
    expect(getModule("chart")?.name).toBe("MiniChart");
  });

  it("registry: backend resolution", () => {
    const result = resolveBackend("canvas", ["html", "canvas"], ["html", "svg"]);
    expect(result).toBe("html");
  });

  // Backends
  it("backend: HTML backend", () => {
    expect(htmlBackend.id).toBe("html");
    expect(htmlBackend.supports).toContain("render:html");
  });

  it("backend: SVG backend", () => {
    expect(svgBackend.id).toBe("svg");
    expect(svgBackend.supports).toContain("render:svg");
  });
});