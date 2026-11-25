// MiniMath — module (Alice). KaTeX-parity typesetting + illustration DSL skeleton.

import type {
  ModuleKind, MeasureConstraints, MeasureResult, Size, RenderHandle,
} from "../MiniRender/core/types";
import type {
  ModuleDescriptor, SemanticModel, RenderContext, RenderResult, RenderNode,
} from "../MiniRender/core/interfaces";
import { register } from "../MiniRender/core/registry";
import { Lexer} from "./lexer.js";
import {Parser, ParseError} from "./parser.js";
import {buildHTML} from "./buildHTML.js";
import {buildMathML} from "./buildMathML.js";
import type {Expression} from "./nodes.js";

export interface MathOptions {
  displayMode?: boolean;
  throwOnError?: boolean;
  errorColor?: string;
  macros?: Record<string, string>;
  minRuleThickness?: number;
  maxSize?: number;
  maxExpand?: number;
  strict?: boolean | string;
  trust?: boolean | ((context: any) => boolean);
  colorIsTextColor?: boolean;
  fleqn?: boolean;
  leqno?: boolean;
  output?: "html" | "mathml" | "htmlAndMathml";
}

export interface MathModel extends SemanticModel {
  kind: "math";
  latex: string;
  options?: MathOptions;
  parsed?: Expression | undefined;
  error?: string | undefined;
}

export function parseLatex(latex: string, options: MathOptions = {}): { expr: Expression | null; error?: string } {
  try {
    const p = new Parser(latex, "math", { macros: options.macros, maxExpand: options.maxExpand, throwOnError: options.throwOnError });
    const expr = p.parse();
    return { expr };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (options.throwOnError) throw e;
    return { expr: null, error: msg };
  }
}

export function renderToHTML(latex: string, options: MathOptions = {}): string {
  const { expr, error } = parseLatex(latex, options);
  if (error) {
    const color = options.errorColor ?? "#cc0000";
    return `<span class="katex-error" style="color:${color}">${escapeHtml(latex)}</span>`;
  }
  return buildHTML(expr!, { ...options, displayMode: options.displayMode ?? false });
}

export function renderToMathML(latex: string, options: MathOptions = {}): string {
  const { expr } = parseLatex(latex, options);
  if (!expr) return "";
  return buildMathML(expr, options.displayMode ?? false);
}

export const mathModule: ModuleDescriptor = {
  id: "math",
  name: "MiniMath",
  version: "0.1.0-phase2",
  capabilities: ["render:html", "render:svg", "measure:intrinsic", "compose:embed", "a11y:aria", "a11y:screenreader", "export:svg", "export:json"],
  supportedBackends: ["html", "svg"],
  parse(input: unknown, options?: unknown): MathModel {
    const latex = String(input ?? "");
    const opts = (options as MathOptions) ?? {};
    const { expr, error } = parseLatex(latex, opts);
    return { kind: "math", version: 1, latex, options: opts, ...(expr ? { parsed: expr } : {}), ...(error ? { error } : {}), metadata: { options: opts } };
  },
  render(model: SemanticModel, ctx: RenderContext): RenderResult {
    const m = model as MathModel;
    const opts = m.options ?? {};
    const node: RenderNode = { id: `math-${Math.random().toString(36).slice(2)}`, kind: "math", children: [], metadata: { latex: m.latex } };
    const container = ctx.container.element as HTMLElement;
    const wrapper = document.createElement("span");
    wrapper.className = "mini-math";
    wrapper.setAttribute("role", "math");
    wrapper.setAttribute("aria-label", m.latex);
    if (m.error) {
      wrapper.style.color = opts.errorColor ?? "#cc0000";
      wrapper.textContent = m.latex;
    } else {
      const html = buildHTML(m.parsed!, { ...opts, displayMode: opts.displayMode ?? false });
      const mathml = buildMathML(m.parsed!, opts.displayMode ?? false);
      wrapper.innerHTML = `<span class="katex-mathml" style="position:absolute;clip:rect(1px,1px,1px,1px);">${mathml}</span><span class="katex-html" aria-hidden="true">${extractInner(html)}</span>`;
    }
    container.appendChild(wrapper);
    const handle: RenderHandle = {
      id: node.id,
      update(input) {
        const newLatex = String(input ?? "");
        const { expr, error } = parseLatex(newLatex, opts);
        m.latex = newLatex;
        if (expr) m.parsed = expr; else delete m.parsed;
        if (error) m.error = error; else delete m.error;
        if (error) { wrapper.style.color = opts.errorColor ?? "#cc0000"; wrapper.textContent = newLatex; }
        else { wrapper.innerHTML = `<span class="katex-mathml" style="position:absolute;clip:rect(1px,1px,1px,1px);">${buildMathML(expr!, opts.displayMode ?? false)}</span><span class="katex-html" aria-hidden="true">${extractInner(buildHTML(expr!, { ...opts, displayMode: opts.displayMode ?? false }))}</span>`; }
      },
      destroy() { wrapper.remove(); },
    };
    return { handle, node };
  },
  measure(model: SemanticModel, _ctx: RenderContext, constraints?: MeasureConstraints): MeasureResult {
    const m = model as MathModel;
    const latex = m.latex;
    // Font-metric-aware width estimate: use canvas measureText when available, else char heuristic.
    let w = 8;
    try {
      if (typeof document !== "undefined") {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.font = "16px serif";
          w = Math.max(8, ctx.measureText(latex.replace(/\\[a-zA-Z]+/g, "x")).width);
        } else {
          w = Math.max(8, latex.length * 8);
        }
      } else {
        w = Math.max(8, latex.length * 8);
      }
    } catch {
      w = Math.max(8, latex.length * 8);
    }
    const h = 16;
    const avail = constraints?.availableWidth;
    const width = avail ? Math.min(w, avail) : w;
    return { intrinsic: { width: w, height: h }, min: { width: 8, height: h }, bbox: { x: 0, y: 0, width: w, height: h }, baseline: h * 0.8 };
  },
  dispose(instance) { instance.destroy(); },
};

register(mathModule);

export interface IllustrationScene { width?: number; height?: number; children: any[]; }
export function illustrate(source: string, container: HTMLElement, options?: any): RenderHandle {
  const w = options?.width ?? 400;
  const h = options?.height ?? 300;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(w));
  svg.setAttribute("height", String(h));
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.setAttribute("class", "mini-math-illustration");
  const cx = w / 2, cy = h / 2, scale = Math.min(w, h) / 4;
  const axis = document.createElementNS("http://www.w3.org/2000/svg", "g");
  axis.setAttribute("stroke", "currentColor"); axis.setAttribute("stroke-width", "1");
  const xline = document.createElementNS("http://www.w3.org/2000/svg", "line");
  xline.setAttribute("x1", "10"); xline.setAttribute("y1", String(cy)); xline.setAttribute("x2", String(w-10)); xline.setAttribute("y2", String(cy));
  const yline = document.createElementNS("http://www.w3.org/2000/svg", "line");
  yline.setAttribute("x1", String(cx)); yline.setAttribute("y1", "10"); yline.setAttribute("x2", String(cx)); yline.setAttribute("y2", String(h-10));
  axis.appendChild(xline); axis.appendChild(yline);
  svg.appendChild(axis);
  const name = (source || "sin").trim().toLowerCase();
  const fns: Record<string, (x: number) => number> = {
    sin: (x) => Math.sin(x), cos: (x) => Math.cos(x), tan: (x) => Math.tan(x),
    "x^2": (x) => x*x, "x^3": (x) => x*x*x, "x": (x) => x,
    sqrt: (x) => (x >= 0 ? Math.sqrt(x) : NaN),
    exp: (x) => Math.exp(x), log: (x) => (x > 0 ? Math.log(x) : NaN),
  };
  const fn = fns[name] ?? ((x: number) => Math.sin(x));
  const pts: string[] = [];
  const n = 200;
  const xmin = -3, xmax = 3;
  for (let i = 0; i <= n; i++) {
    const x = xmin + (xmax - xmin) * i / n;
    const y = fn(x);
    if (!isFinite(y)) { pts.push(""); continue; }
    const px = cx + x * scale / 2;
    const py = cy - y * scale / 2;
    pts.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", pts.filter(Boolean).join(" "));
  polyline.setAttribute("fill", "none"); polyline.setAttribute("stroke", "steelblue"); polyline.setAttribute("stroke-width", "2");
  svg.appendChild(polyline);
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x", "12"); label.setAttribute("y", "20"); label.setAttribute("font-size", "12"); label.setAttribute("fill", "currentColor");
  label.textContent = name;
  svg.appendChild(label);
  container.appendChild(svg);
  return { id: "illustration", update() {}, destroy() { svg.remove(); } };
}

export default mathModule;

function escapeHtml(s: string): string { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function extractInner(html: string): string {
  const m = html.match(/katex-html" aria-hidden="true">([\s\S]*)<\/span><\/span>$/);
  return m ? m[1]! : html;
}
