// MiniRender — Backend Implementations
// Phase 1: HTML and SVG backends

import type { Backend, RenderNode, RenderContext } from "./interfaces.js";
import type { BackendId, RenderTarget, Capability } from "./types.js";

// ─── HTML Backend ───────────────────────────────────────────────

export class HtmlBackend implements Backend {
  id: BackendId = "html";
  supports: Capability[] = [
    "render:html",
    "measure:intrinsic",
    "a11y:aria",
    "a11y:keyboard",
    "a11y:screenreader",
  ];

  createTarget(container: unknown): RenderTarget {
    const el = (typeof document !== "undefined" ? document.createElement("div") : { tagName: "div" }) as unknown;
    if (container && typeof (container as any).appendChild === "function") {
      (container as any).appendChild(el);
    }
    return { type: "html", element: el };
  }

  render(node: RenderNode, ctx: RenderContext): void {
    const target = ctx.container;
    const el = target.element as any;
    if (!el) return;

    // Minimal HTML rendering: create element for each node
    const domNode = typeof document !== "undefined" ? document.createElement("div") : { tagName: "div" };
    (domNode as any).setAttribute("data-mini-id", node.id);
    (domNode as any).setAttribute("data-mini-kind", node.kind);

    if (node.children) {
      for (const child of node.children) {
        // Recursive rendering would go here; for Phase 1, basic
      }
    }

    if (el.appendChild) {
      el.appendChild(domNode);
    }
  }

  clear(target: RenderTarget): void {
    const el = target.element as any;
    if (el && el.innerHTML !== undefined) {
      el.innerHTML = "";
    }
  }

  measureText(text: string, font: { family: string; size: number }): { width: number; height: number } {
    // Fallback: approximate measurement
    return { width: text.length * font.size * 0.6, height: font.size * 1.2 };
  }

  dispose(target: RenderTarget): void {
    const el = target.element as any;
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }
}

// ─── SVG Backend ────────────────────────────────────────────────

export class SvgBackend implements Backend {
  id: BackendId = "svg";
  supports: Capability[] = [
    "render:svg",
    "measure:intrinsic",
    "export:svg",
    "a11y:aria",
  ];

  createTarget(container: unknown): RenderTarget {
    const el = typeof document !== "undefined" ? document.createElementNS("http://www.w3.org/2000/svg", "svg") : { tagName: "svg" };
    if (container && typeof (container as any).appendChild === "function") {
      (container as any).appendChild(el);
    }
    return { type: "svg", element: el };
  }

  render(node: RenderNode, ctx: RenderContext): void {
    const target = ctx.container;
    const el = target.element as any;
    if (!el) return;

    const svgNode = typeof document !== "undefined"
      ? document.createElementNS("http://www.w3.org/2000/svg", "g")
      : { tagName: "g" };
    (svgNode as any).setAttribute("data-mini-id", node.id);
    (svgNode as any).setAttribute("data-mini-kind", node.kind);

    if (el.appendChild) {
      el.appendChild(svgNode);
    }
  }

  clear(target: RenderTarget): void {
    const el = target.element as any;
    if (el) {
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
    }
  }

  measureText(text: string, font: { family: string; size: number }): { width: number; height: number } {
    return { width: text.length * font.size * 0.6, height: font.size * 1.2 };
  }

  dispose(target: RenderTarget): void {
    const el = target.element as any;
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }
}

// ─── Backend factory ────────────────────────────────────────────

export function createBackend(id: BackendId): Backend {
  switch (id) {
    case "html":
      return new HtmlBackend();
    case "svg":
      return new SvgBackend();
    default:
      return new HtmlBackend();
  }
}
