// MiniMath — HTML builder (KaTeX-inspired span-based output)

import type { ParseNode, Expression } from "./nodes.js";
import { greekLower, greekUpper } from "./symbols.js";

export interface BuildOptions {
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

const SIZE_CLASSES: Record<string, string> = {
  tiny: "size1", scriptsize: "size2", footnotesize: "size3", small: "size4",
  normalsize: "size5", large: "size6", Large: "size7", LARGE: "size8", huge: "size9", Huge: "size10",
};

export function buildHTML(expr: Expression, options: BuildOptions = {}): string {
  const display = options.displayMode ?? false;
  const parts = expr.map(n => renderNode(n, options, display)).join("");
  const cls = display ? "katex-display" : "katex";
  return `<span class="${cls}"><span class="katex-mathml">…</span><span class="katex-html" aria-hidden="true">${parts}</span></span>`;
}

function renderNode(node: any, opts: BuildOptions, display: boolean): string {
  if (!node) return "";
  switch (node.type) {
    case "ord": case "mathord": case "text": {
      const txt = escapeHtml(String(node.text ?? ""));
      const cls = node.type === "text" ? "mord text" : "mord";
      return `<span class="${cls}">${txt}</span>`;
    }
    case "operator": {
      const big = node.big ? "op" : "mop";
      const txt = escapeHtml(String(node.text ?? node.name ?? ""));
      return `<span class="${big}">${txt}</span>`;
    }
    case "bin": return `<span class="mbin">${escapeHtml(node.text)}</span>`;
    case "rel": return `<span class="mrel">${escapeHtml(node.text)}</span>`;
    case "open": case "close": case "punct": case "inner": {
      const cls = node.type === "open" ? "mopen" : node.type === "close" ? "mclose" : node.type === "punct" ? "mpunct" : "minner";
      return `<span class="${cls}">${escapeHtml(node.text ?? "")}</span>`;
    }
    case "genfrac": {
      const num = (node.numerator as Expression).map(n => renderNode(n, opts, display)).join("");
      const den = (node.denominator as Expression).map(n => renderNode(n, opts, display)).join("");
      const bar = node.hasBarLine ? `<span class="frac-line"></span>` : "";
      const left = node.leftDelim ? `<span class="mopen">${escapeHtml(node.leftDelim)}</span>` : "";
      const right = node.rightDelim ? `<span class="mclose">${escapeHtml(node.rightDelim)}</span>` : "";
      return `<span class="mfrac">${left}<span class="vlist"><span class="vlist-t"><span class="vlist-r"><span class="vlist-l"><span class="frac-num">${num}</span><span class="frac-den">${den}</span></span></span></span></span>${bar}${right}</span>`;
    }
    case "binom": {
      const num = (node.numerator as Expression).map(n => renderNode(n, opts, display)).join("");
      const den = (node.denominator as Expression).map(n => renderNode(n, opts, display)).join("");
      return `<span class="mbinom"><span class="vlist"><span class="frac-num">${num}</span><span class="frac-den">${den}</span></span></span>`;
    }
    case "sqrt": {
      const body = (node.body as Expression).map(n => renderNode(n, opts, display)).join("");
      const idx = node.index ? (node.index as Expression).map(n => renderNode(n, opts, display)).join("") : "";
      return `<span class="msqrt"><span class="sqrt-sign">√</span>${idx ? `<span class="sqrt-index">${idx}</span>` : ""}<span class="sqrt-body">${body}</span></span>`;
    }
    case "supsub": {
      const base = node.base ? renderNode(node.base, opts, display) : "";
      const sup = node.sup ? `<span class="supsub sup">${(node.sup as Expression).map((n: any) => renderNode(n, opts, display)).join("")}</span>` : "";
      const sub = node.sub ? `<span class="supsub sub">${(node.sub as Expression).map((n: any) => renderNode(n, opts, display)).join("")}</span>` : "";
      return `<span class="msupsub">${base}${sup}${sub}</span>`;
    }
    case "accent": {
      const base = renderNode(node.base, opts, display);
      const acc = accentChar(node.label);
      return `<span class="maccent"><span class="accent-body">${base}</span><span class="accent">${acc}</span></span>`;
    }
    case "overline": {
      const body = (node.body as Expression).map(n => renderNode(n, opts, display)).join("");
      return `<span class="moverline"><span class="overline-line"></span><span class="overline-body">${body}</span></span>`;
    }
    case "underline": {
      const body = (node.body as Expression).map(n => renderNode(n, opts, display)).join("");
      return `<span class="munderline"><span class="underline-body">${body}</span><span class="underline-line"></span></span>`;
    }
    case "overbrace": {
      const body = (node.body as Expression).map(n => renderNode(n, opts, display)).join("");
      return `<span class="moverbrace">${body}<span class="brace">⏞</span></span>`;
    }
    case "underbrace": {
      const body = (node.body as Expression).map(n => renderNode(n, opts, display)).join("");
      return `<span class="munderbrace">${body}<span class="brace">⏟</span></span>`;
    }
    case "phantom": {
      const body = (node.body as Expression).map(n => renderNode(n, opts, display)).join("");
      return `<span class="mphantom" style="visibility:hidden">${body}</span>`;
    }
    case "sizing": {
      const body = (node.body as Expression).map(n => renderNode(n, opts, display)).join("");
      const cls = SIZE_CLASSES[node.size] ?? "";
      return `<span class="sizing ${cls}">${body}</span>`;
    }
    case "styling": {
      const body = (node.body as Expression).map(n => renderNode(n, opts, display)).join("");
      return `<span class="math-${node.style}">${body}</span>`;
    }
    case "spacing": {
      if (node.width === Infinity) return `<span class="mspace hfill"></span>`;
      const em = (node.width as number) * 1; // em units approx
      return `<span class="mspace" style="margin-right:${em}em"></span>`;
    }
    case "kern": {
      const v = node.dimension ?? 0;
      return `<span class="mkern" style="margin-right:${v}em"></span>`;
    }
    case "color": {
      const body = (node.body as Expression).map(n => renderNode(n, opts, display)).join("");
      return `<span style="color:${escapeHtml(node.color)}">${body}</span>`;
    }
    case "boxed": {
      const body = (node.body as Expression).map(n => renderNode(n, opts, display)).join("");
      return `<span class="mboxed" style="border:1px solid currentColor;padding:0 0.25em">${body}</span>`;
    }
    case "rule": {
      return `<span class="rule" style="display:inline-block;width:${node.width}em;height:${node.height}em;vertical-align:${node.shift ?? 0}em;background:currentColor"></span>`;
    }
    case "cr": return `<br/>`;
    case "hline": return `<span class="hline" style="display:block;border-bottom:1px solid currentColor;margin:0.15em 0;width:100%"></span>`;
    case "tag": {
      const body = (node.body as Expression).map(n => renderNode(n, opts, display)).join("");
      return `<span class="tag">${body}</span>`;
    }
    case "environment": case "array": case "matrix": case "cases": case "aligned": {
      const rows = (node.body as Expression[]).map(row => {
        const cells = (Array.isArray(row) ? row : [row]).map((cell, ci) => {
          const c = Array.isArray((cell as any).body) ? (cell as any).body : [cell];
          const alignChar = (node.colAlign && node.colAlign[ci]) ? String(node.colAlign[ci]) : "c";
          const ta = alignChar === "l" ? "left" : alignChar === "r" ? "right" : "center";
          return `<span class="cell" style="text-align:${ta}">${c.map((n: any) => renderNode(n, opts, display)).join("")}</span>`;
        }).join(`<span class="align-sep"></span>`);
        return `<span class="row">${cells}</span>`;
      }).join(`<br/>`);
      const left = node.leftDelim ? `<span class="mopen">${escapeHtml(node.leftDelim)}</span>` : "";
      const right = node.rightDelim ? `<span class="mclose">${escapeHtml(node.rightDelim)}</span>` : "";
      const cls = node.type === "cases" ? "mcases" : node.type === "matrix" ? "mmatrix" : "marray";
      return `<span class="${cls}">${left}<span class="tbody">${rows}</span>${right}</span>`;
    }
    case "leftright": {
      const body = (node.body as Expression).map(n => renderNode(n, opts, display)).join("");
      const leftD = node.left === "." ? "" : escapeHtml(node.left);
      const rightD = node.right === "." ? "" : escapeHtml(node.right);
      const sz = node.size ?? 1;
      return `<span class="mleft-right"><span class="mopen" style="font-size:${sz}em;vertical-align:middle">${leftD}</span><span class="mleftright-body">${body}</span><span class="mclose" style="font-size:${sz}em;vertical-align:middle">${rightD}</span></span>`;
    }
    case "left": return `<span class="mopen delim-size">${escapeHtml(node.delim === "." ? "" : node.delim)}</span>`;
    case "right": return `<span class="mclose delim-size">${escapeHtml(node.delim === "." ? "" : node.delim)}</span>`;
    case "middle": return `<span class="mrel delim-size">${escapeHtml(node.delim === "." ? "" : node.delim)}</span>`;
    case "delim": return `<span class="delim" style="font-size:${node.size ?? 1}em">${escapeHtml(node.text)}</span>`;
    case "not": {
      const body = renderNode(node.body, opts, display);
      return `<span class="mnot">${body}<span class="not-line">/</span></span>`;
    }
    case "cancel": {
      const body = (node.body as Expression).map(n => renderNode(n, opts, display)).join("");
      return `<span class="mcancel">${body}</span>`;
    }
    case "operatorname": {
      const body = node.body ? (node.body as Expression).map(n => renderNode(n, opts, display)).join("") : escapeHtml(node.name ?? "");
      return `<span class="mop">${escapeHtml(node.name ?? "")}${body}</span>`;
    }
    case "vcenter": case "smash": case "raisebox": case "hbox": case "reflectbox": case "lap": {
      const body = Array.isArray(node.body) ? (node.body as Expression).map(n => renderNode(n, opts, display)).join("") : renderNode(node.body, opts, display);
      return `<span class="${node.type}">${body}</span>`;
    }
    case "group": {
      const body = Array.isArray(node.body) ? (node.body as Expression).map(n => renderNode(n, opts, display)).join("") : "";
      // body may be in node.children? handle
      if (node.children) return (node.children as any[]).map((n: any) => renderNode(n, opts, display)).join("");
      return body;
    }
    case "macro": {
      const body = Array.isArray(node.body) ? (node.body as Expression).map(n => renderNode(n, opts, display)).join("") : "";
      return body;
    }
    default: {
      if (node.body && Array.isArray(node.body)) {
        return (node.body as Expression).map(n => renderNode(n, opts, display)).join("");
      }
      return escapeHtml(String(node.text ?? node.value ?? ""));
    }
  }
}

function accentChar(label: string): string {
  const map: Record<string, string> = {
    hat: "̂", check: "̌", tilde: "̃", acute: "́", grave: "̀",
    dot: "̇", ddot: "̈", bar: "̄", breve: "̆", vec: "⃗",
    widehat: "̂", widetilde: "̃",
    overrightarrow: "→", overleftarrow: "←", overleftrightarrow: "↔",
    overparen: "⏜", underparen: "⏝",
  };
  return map[label] ?? "̂";
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
