// MiniRender — HTML backend (Phase 1 minimal, aligned with Cortana's contract)

import type { BackendId, Capability, FontSpec, RenderTarget } from "../core/types";
import type { Backend, RenderContext, RenderNode } from "../core/interfaces";

export const htmlBackend: Backend = {
  id: "html",
  supports: ["render:html", "measure:intrinsic", "a11y:aria", "a11y:keyboard", "a11y:screenreader"],
  createTarget(container: unknown): RenderTarget {
    return { type: "html", element: container };
  },
  render(node: RenderNode, ctx: RenderContext): void {
    const el = document.createElement("div");
    el.setAttribute("data-render-node", node.id);
    el.setAttribute("data-kind", node.kind);
    if (node.children) {
      for (const c of node.children) {
        const child = document.createElement("div");
        child.setAttribute("data-render-node", c.id);
        child.setAttribute("data-kind", c.kind);
        el.appendChild(child);
      }
    }
    (ctx.container.element as HTMLElement).appendChild(el);
  },
  clear(target: RenderTarget): void {
    (target.element as HTMLElement).innerHTML = "";
  },
  measureText(text: string, font: { family: string; size: number }): { width: number; height: number } {
    const span = document.createElement("span");
    span.style.fontFamily = font.family;
    span.style.fontSize = `${font.size}px`;
    span.style.visibility = "hidden";
    span.style.position = "absolute";
    span.textContent = text;
    document.body.appendChild(span);
    const rect = span.getBoundingClientRect();
    document.body.removeChild(span);
    return { width: rect.width, height: rect.height };
  },
  dispose(target: RenderTarget): void {
    (target.element as HTMLElement).innerHTML = "";
  },
};
export default htmlBackend;
export type { BackendId, Capability, FontSpec };
