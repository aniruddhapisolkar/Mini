// MiniRender — Canvas backend (Phase 3, Cortana)

import type { Backend, RenderContext, RenderNode } from "../core/interfaces";
import type { RenderTarget } from "../core/types";
import type { BackendId, Capability, FontSpec, TextMetrics } from "../core/types";

export const canvasBackend: Backend = {
  id: "canvas",
  supports: ["render:canvas", "measure:intrinsic", "a11y:aria"],
  createTarget(container: unknown): RenderTarget {
    const canvas = typeof document !== "undefined"
      ? document.createElement("canvas")
      : ({} as any);
    if (container && typeof (container as any).appendChild === "function") {
      (container as any).appendChild(canvas);
    }
    return { type: "canvas", element: canvas as any };
  },
  render(node: RenderNode, ctx: RenderContext): void {
    const canvas = ctx.container.element as HTMLCanvasElement;
    if (!canvas || typeof canvas.getContext !== "function") return;
    const c = canvas.getContext("2d");
    if (!c) return;
    // Basic render: clear and draw node id as text
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = "#333";
    c.font = "12px sans-serif";
    c.fillText(node.id, 10, 20);
  },
  clear(target: RenderTarget): void {
    const canvas = target.element as HTMLCanvasElement;
    if (canvas && typeof canvas.getContext === "function") {
      const c = canvas.getContext("2d");
      if (c) c.clearRect(0, 0, canvas.width, canvas.height);
    }
  },
  dispose(target: RenderTarget): void {
    // Canvas cleanup
  },
  measureText(text: string, font: FontSpec): TextMetrics {
    // Approximate text metrics (no canvas context in node)
    const width = text.length * (font.size * 0.6);
    const height = font.size * 1.2;
    return { width, height, ascent: font.size * 0.8, descent: font.size * 0.2, lineHeight: height };
  },
};

export function createCanvasBackend(): Backend {
  return canvasBackend;
}