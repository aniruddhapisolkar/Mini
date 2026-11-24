// MiniRender — SVG backend (Phase 1, Cortana)

import type { Backend, RenderContext, RenderNode } from "../core/interfaces";
import type { RenderTarget } from "../core/types";
import type { BackendId, Capability, FontSpec, TextMetrics } from "../core/types";

export const svgBackend: Backend = {
  id: "svg",
  supports: ["render:svg", "measure:intrinsic", "export:svg", "a11y:aria"],
  createTarget(container: unknown): RenderTarget {
    const svg = typeof document !== "undefined"
      ? document.createElementNS("http://www.w3.org/2000/svg", "svg")
      : ({} as any);
    if (container && typeof (container as any).appendChild === "function") {
      (container as any).appendChild(svg);
    }
    return { type: "svg", element: svg as any };
  },
  render(node: RenderNode, ctx: RenderContext): void {
    const g = typeof document !== "undefined"
      ? document.createElementNS("http://www.w3.org/2000/svg", "g")
      : ({} as any);
    if (g.setAttribute) {
      g.setAttribute("data-render-node", node.id);
      g.setAttribute("data-kind", node.kind);
    }
    if (node.children) {
      for (const c of node.children) {
        const child = typeof document !== "undefined"
          ? document.createElementNS("http://www.w3.org/2000/svg", "g")
          : ({} as any);
        if (child.setAttribute) {
          child.setAttribute("data-render-node", c.id);
          child.setAttribute("data-kind", c.kind);
        }
        if (g.appendChild) g.appendChild(child);
      }
    }
    if (ctx.container.element && (ctx.container.element as any).appendChild) {
      (ctx.container.element as any).appendChild(g);
    }
  },
  clear(target: RenderTarget): void {
    const el = target.element as any;
    if (el) {
      while (el.firstChild) el.removeChild(el.firstChild);
    }
  },
  measureText(text: string, font: FontSpec): TextMetrics {
    const width = text.length * font.size * 0.6;
    const height = font.size * 1.2;
    return { width, height, ascent: height * 0.8, descent: height * 0.2, lineHeight: height };
  },
  dispose(target: RenderTarget): void {
    const el = target.element as any;
    if (el && el.parentNode) el.parentNode.removeChild(el);
  },
};

export { svgBackend as default };
