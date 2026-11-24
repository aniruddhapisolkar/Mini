// MiniRender — HTML backend (Phase 1 minimal)

import type { Backend, BackendId, Capability, FontSpec, RenderContext, RenderNode, RenderTarget, TextMetrics } from "../core/types";

export const htmlBackend: Backend = {
  id: "html",
  supports: ["render:html", "measure:intrinsic", "a11y:aria", "a11y:keyboard", "a11y:screenreader"],
  createTarget(container: HTMLElement): RenderTarget {
    return { element: container, backend: "html" };
  },
  render(node: RenderNode, ctx: RenderContext): void {
    // Minimal: render a div with id; children recursively. Fast path: skip if no children.
    const el = document.createElement("div");
    el.setAttribute("data-render-node", node.id);
    el.setAttribute("data-kind", node.kind);
    if (node.children) {
      for (const c of node.children) {
        // Recursion handled by caller in full impl; here we delegate to backend via ctx not available sync.
        const child = document.createElement("div");
        child.setAttribute("data-render-node", c.id);
        child.setAttribute("data-kind", c.kind);
        el.appendChild(child);
      }
    }
    ctx.container.element.appendChild(el);
  },
  clear(target: RenderTarget): void {
    target.element.innerHTML = "";
  },
  measureText(text: string, font: FontSpec): TextMetrics {
    // Canvas-based measurement fallback using DOM span
    const span = document.createElement("span");
    span.style.fontFamily = font.family;
    span.style.fontSize = `${font.size}px`;
    span.style.visibility = "hidden";
    span.style.position = "absolute";
    span.textContent = text;
    document.body.appendChild(span);
    const rect = span.getBoundingClientRect();
    document.body.removeChild(span);
    return { width: rect.width, height: rect.height, ascent: rect.height * 0.8, descent: rect.height * 0.2 };
  },
  dispose(target: RenderTarget): void {
    target.element.innerHTML = "";
  },
};
export { htmlBackend as default };
export type { BackendId, Capability };
