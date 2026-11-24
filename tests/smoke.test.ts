import { describe, it, expect } from "vitest";
import {
  point,
  size,
  rect,
  addPoints,
  distance,
  sanitizeHtml,
  escapeHtml,
  createResourceManager,
  createCache,
  createDiagnostics,
  createScheduler,
  createRenderHandle,
  register,
  getModule,
  hasModule,
  resolveBackend,
  HtmlBackend,
  SvgBackend,
  createBackend,
} from "../MiniRender/index.js";

describe("MiniRender Phase 1 Smoke Tests", () => {
  it("geometry: point operations", () => {
    const p = point(3, 4);
    expect(p.x).toBe(3);
    expect(p.y).toBe(4);
    expect(distance(point(0, 0), point(3, 4))).toBe(5);
    expect(addPoints(point(1, 2), point(3, 4))).toEqual({ x: 4, y: 6 });
  });

  it("geometry: rect operations", () => {
    const r = rect(0, 0, 10, 20);
    expect(r.width).toBe(10);
    expect(r.height).toBe(20);
  });

  it("text: sanitizeHtml removes dangerous tags", () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain("script");
    expect(output).toContain("Hello");
  });

  it("text: escapeHtml", () => {
    expect(escapeHtml('<div>"test"</div>')).toBe("&lt;div&gt;&quot;test&quot;&lt;/div&gt;");
  });

  it("lifecycle: resource manager ref-counting", () => {
    const rm = createResourceManager();
    const val = rm.acquire("font", () => "font-data");
    expect(val).toBe("font-data");
    expect(rm.has("font")).toBe(true);
    rm.release("font");
    expect(rm.has("font")).toBe(false);
  });

  it("lifecycle: cache", () => {
    const cache = createCache();
    cache.set("key", 42);
    expect(cache.get("key")).toBe(42);
    expect(cache.has("key")).toBe(true);
    cache.delete("key");
    expect(cache.has("key")).toBe(false);
  });

  it("lifecycle: diagnostics", () => {
    const diag = createDiagnostics();
    diag.report({ level: "error", code: "TEST", message: "test error" });
    expect(diag.getErrors().length).toBe(1);
    expect(diag.getErrors()[0].code).toBe("TEST");
  });

  it("lifecycle: render handle", () => {
    let destroyed = false;
    const handle = createRenderHandle(
      () => {},
      () => { destroyed = true; }
    );
    expect(handle.id).toBeTruthy();
    handle.destroy();
    expect(destroyed).toBe(true);
  });

  it("registry: module registration", () => {
    const descriptor = {
      id: "chart" as const,
      name: "MiniChart",
      version: "0.1.0",
      capabilities: ["render:html" as const],
      supportedBackends: ["html" as const],
      parse: () => ({ kind: "chart" as const, version: 1 }),
      render: () => ({ handle: createRenderHandle(() => {}, () => {}) }),
    };
    register(descriptor);
    expect(hasModule("chart")).toBe(true);
    expect(getModule("chart")?.name).toBe("MiniChart");
  });

  it("registry: backend resolution", () => {
    const result = resolveBackend("canvas", ["html", "canvas"], ["html", "svg"]);
    expect(result).toBe("html"); // canvas not available, falls back to html
  });

  it("backend: HTML backend", () => {
    const backend = createBackend("html");
    expect(backend.id).toBe("html");
    expect(backend.supports).toContain("render:html");
  });

  it("backend: SVG backend", () => {
    const backend = createBackend("svg");
    expect(backend.id).toBe("svg");
    expect(backend.supports).toContain("render:svg");
  });
});