// MiniCode — module implementation (Phase 2)

import type {
  ModuleDescriptor, SemanticModel, RenderContext, RenderResult, RenderNode,
} from "../MiniRender/core/interfaces.js";
import type { RenderHandle, MeasureConstraints, MeasureResult } from "../MiniRender/core/types.js";
import { register } from "../MiniRender/core/registry.js";
import { tokenize, getGrammar, listLanguages } from "./tokenizer.js";
import type { CodeModel, CodeToken } from "./types.js";
import { getTheme } from "./themes.js";
import { TextProcessor } from "../MiniRender/text/index.js";
const escapeHtml = TextProcessor.escapeHtml;

function paintCode(wrapper: HTMLElement, m: CodeModel, opts: Record<string, unknown>): void {
  const themeId = (opts.theme as string) || "github-light";
  const theme = getTheme(themeId);
  const lineNumbers = opts.lineNumbers !== false;
  const highlightLines = (opts.highlightLines as number[]) || [];
  const diff = (opts.diff as Array<{ line: number; type: "add" | "del" }>) || [];
  const foldRanges = (opts.foldRanges as Array<{ start: number; end: number }>) || [];

  const lines = m.source.split("\n");
  const lineTokens: CodeToken[][] = lines.map(() => []);
  for (const t of m.tokens) {
    if (t.text === "\n") continue;
    if (t.line >= 0 && t.line < lineTokens.length) {
      const arr = lineTokens[t.line];
      if (arr) arr.push(t);
    }
  }

  wrapper.innerHTML = "";
  wrapper.className = "mini-code";
  wrapper.style.background = theme.background;
  wrapper.style.color = theme.foreground;
  wrapper.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, monospace";
  wrapper.style.fontSize = "13px";
  wrapper.style.lineHeight = "1.5";
  wrapper.style.padding = "12px";
  wrapper.style.borderRadius = "6px";
  wrapper.style.overflow = "auto";

  const pre = document.createElement("pre");
  pre.style.margin = "0";
  const code = document.createElement("code");
  code.className = `language-${m.language}`;

  for (let li = 0; li < lines.length; li++) {
    const lineEl = document.createElement("div");
    lineEl.className = "mini-code-line";
    lineEl.setAttribute("data-line", String(li + 1));
    if (highlightLines.includes(li + 1)) lineEl.style.background = "rgba(255,235,59,0.15)";
    const diffEntry = diff.find(d => d.line === li + 1);
    if (diffEntry) {
      lineEl.style.background = diffEntry.type === "add" ? "rgba(46,160,67,0.15)" : "rgba(248,81,73,0.15)";
    }

    if (lineNumbers) {
      const ln = document.createElement("span");
      ln.className = "mini-code-lineno";
      ln.textContent = String(li + 1);
      ln.style.display = "inline-block";
      ln.style.width = "3em";
      ln.style.textAlign = "right";
      ln.style.marginRight = "1em";
      ln.style.color = theme.colors.comment ?? theme.foreground;
      ln.style.userSelect = "none";
      lineEl.appendChild(ln);
    }

    if (diffEntry) {
      const marker = document.createElement("span");
      marker.textContent = diffEntry.type === "add" ? "+" : "-";
      marker.style.marginRight = "0.5em";
      marker.style.color = diffEntry.type === "add" ? "#2ea043" : "#f85149";
      lineEl.appendChild(marker);
    }

    const toks = lineTokens[li] || [];
    if (toks.length === 0) {
      const span = document.createElement("span");
      span.textContent = lines[li] || " ";
      span.style.color = theme.foreground;
      lineEl.appendChild(span);
    } else {
      for (const tok of toks) {
        const span = document.createElement("span");
        span.className = `token ${tok.scope}`;
        span.textContent = tok.text;
        span.style.color = theme.colors[tok.scope] || theme.foreground;
        lineEl.appendChild(span);
      }
    }
    code.appendChild(lineEl);
  }
  pre.appendChild(code);
  wrapper.appendChild(pre);
}

export const codeModule: ModuleDescriptor = {
  id: "code",
  name: "MiniCode",
  version: "0.1.0-phase2",
  capabilities: ["render:html", "render:svg", "measure:intrinsic", "compose:embed", "perf:stream", "perf:incremental", "a11y:aria"],
  supportedBackends: ["html", "svg"],
  parse(input: unknown, options?: unknown): CodeModel {
    const opts = (options ?? {}) as { language?: string };
    const lang = opts.language ?? "text";
    const source = String(input ?? "");
    const tokens = tokenize(source, lang);
    const lines = source.split("\n");
    return { kind: "code", version: 1, source, language: lang, tokens, lines };
  },
  render(model: SemanticModel, ctx: RenderContext): RenderResult {
    const m = model as unknown as CodeModel;
    const opts = (model.metadata ?? {}) as Record<string, unknown>;
    const root: RenderNode = { id: "code-root", kind: "group", children: [] };
    const container = (ctx.container.element as HTMLElement);

    const wrapper = document.createElement("div");
    paintCode(wrapper, m, opts);
    container.appendChild(wrapper);

    const handle: RenderHandle = {
      id: root.id,
      update(input) {
        const newModel = codeModule.parse(input, { ...opts, language: m.language });
        paintCode(wrapper, newModel as unknown as CodeModel, opts);
      },
      destroy() { wrapper.remove(); },
    };
    return { handle, node: root };
  },
  measure(model, _ctx, _constraints?): MeasureResult {
    const m = model as unknown as CodeModel;
    const lines = m.source.split("\n").length;
    const maxLineLen = Math.max(0, ...m.source.split("\n").map(l => l.length));
    const w = maxLineLen * 8 + 60;
    const h = lines * 20 + 24;
    return { intrinsic: { width: w, height: h }, min: { width: 100, height: 20 }, bbox: { x: 0, y: 0, width: w, height: h } };
  },
};

register(codeModule);
export default codeModule;

export { tokenize, getGrammar, listLanguages } from "./tokenizer.js";
export type { CodeModel, CodeToken, LanguageGrammar, Theme } from "./types.js";
export { getTheme, themes, themeToCss } from "./themes.js";
export { codeModule as miniCode };
