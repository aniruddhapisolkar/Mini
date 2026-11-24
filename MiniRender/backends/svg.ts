// MiniRender — SVG backend (Phase 1, Cortana)

import type { Backend, BackendId, Capability, FontSpec, RenderContext, RenderNode, RenderTarget, TextMetrics } from "../core/types";

export const svgBackend: Backend = {
  id: "svg",
  supports: ["render:svg", "measure:intrinsic", "export:svg", "a11y:aria"],
  createTarget(container: HTMLElement): RenderTarget {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    container.appendChild(svg);
    return { element: svg, backend: "svg" };
  },
  render(node: RenderNode, ctx: RenderContext): void {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("data-render-node", node.id);
    g.setAttribute("data-kind", node.kind);
    if (node.children) {
      for (const c of node.children) {
        const child = document.createElementNS("http://www.w3.org/2000/svg", "g");
        child.setAttribute("data-render-node", c.id);
        child.setAttribute("data-kind", c.kind);
        g.appendChild(child);
      }
    }
    ctx.container.element.appendChild(g);
  },
  clear(target: RenderTarget): void {
    const el = target.element as SVGElement;
    while (el.firstChild) el.removeChild(el.firstChild);
  },
  measureText(text: string, font: FontSpec): TextMetrics {
    // Fallback approximate measurement
    const width = text.length * font.size * 0.6;
    const height = font.size * 1.2;
    return { width, height, ascent: height * 0.8, descent: height * 0.2 };
  },
  dispose(target: RenderTarget): void {
    const el = target.element as SVGElement;
    if (el.parentNode) el.parentNode.removeChild(el);
  },
};

export { svgBackend as default };
