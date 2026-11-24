// MiniCode — Phase 1 stub reference implementation (Jimbo)
// Demonstrates module contract: parse/render/measure + tokenization + composition.

import type {
  ModuleDescriptor, SemanticModel, RenderContext, RenderResult, RenderNode,
} from "../MiniRender/core/interfaces";
import type { RenderHandle, MeasureConstraints, MeasureResult, Size } from "../MiniRender/core/types";
import { register } from "../MiniRender/core/registry";

interface CodeToken {
  text: string;
  type: "keyword" | "string" | "comment" | "number" | "operator" | "identifier" | "plain";
  line: number;
  column: number;
}

interface CodeModel extends SemanticModel {
  kind: "code";
  source: string;
  language: string;
  tokens: CodeToken[];
}

// Minimal keyword sets for a few languages (Phase 1 stub; full grammars in Phase 2)
const KEYWORDS: Record<string, Set<string>> = {
  javascript: new Set(["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "import", "export", "from", "default", "new", "this", "true", "false", "null", "undefined", "async", "await", "try", "catch", "throw"]),
  typescript: new Set(["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "import", "export", "from", "default", "new", "this", "true", "false", "null", "undefined", "async", "await", "try", "catch", "throw", "interface", "type", "enum", "implements", "extends", "readonly", "private", "public", "protected"]),
  python: new Set(["def", "class", "return", "if", "elif", "else", "for", "while", "import", "from", "as", "try", "except", "raise", "with", "yield", "lambda", "True", "False", "None", "and", "or", "not", "in", "is", "pass", "break", "continue"]),
};

export const codeModule: ModuleDescriptor = {
  id: "code",
  name: "MiniCode",
  version: "0.0.0-phase1",
  capabilities: ["render:html", "render:svg", "measure:intrinsic", "compose:embed", "perf:stream", "perf:incremental", "a11y:aria"],
  supportedBackends: ["html", "svg"],
  parse(input: unknown, options?: unknown): CodeModel {
    const opts = (options ?? {}) as { language?: string };
    const lang = opts.language ?? "text";
    const source = String(input ?? "");
    const tokens = tokenize(source, lang);
    return { kind: "code", version: 1, source, language: lang, tokens };
  },
  render(model: SemanticModel, ctx: RenderContext): RenderResult {
    const m = model as CodeModel;
    const root: RenderNode = { id: "code-root", kind: "group", children: [] };
    const container = document.createElement("div");
    container.className = "mini-code";

    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.className = `language-${m.language}`;

    // Render tokens as spans
    const lines = m.source.split("\n");
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const lineEl = document.createElement("div");
      lineEl.className = "mini-code-line";
      lineEl.setAttribute("data-line", String(lineIdx + 1));

      const lineTokens = m.tokens.filter(t => t.line === lineIdx);
      if (lineTokens.length === 0) {
        const span = document.createElement("span");
        span.className = "token plain";
        span.textContent = lines[lineIdx] ?? "";
        lineEl.appendChild(span);
      } else {
        for (const tok of lineTokens) {
          const span = document.createElement("span");
          span.className = `token ${tok.type}`;
          span.textContent = tok.text;
          lineEl.appendChild(span);
        }
      }
      code.appendChild(lineEl);
    }
    pre.appendChild(code);
    container.appendChild(pre);
    (ctx.container.element as HTMLElement).appendChild(container);

    const handle: RenderHandle = {
      id: root.id,
      update(input) {
        // Re-tokenize and re-render (simplified)
        const newModel = codeModule.parse(input, { language: m.language });
        container.innerHTML = "";
        const newResult = codeModule.render(newModel, ctx);
      },
      destroy() { container.remove(); },
    };
    return { handle, node: root };
  },
  measure(_model, _ctx, _constraints?): MeasureResult {
    const m = _model as CodeModel;
    const lines = m.source.split("\n").length;
    const maxLineLen = Math.max(...m.source.split("\n").map(l => l.length), 0);
    const w = maxLineLen * 8 + 40; // 40 for line numbers
    const h = lines * 16 + 8;
    return { intrinsic: { width: w, height: h }, min: { width: 100, height: 16 }, bbox: { x: 0, y: 0, width: w, height: h } };
  },
};

function tokenize(source: string, language: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  const keywords = KEYWORDS[language] ?? new Set();
  const lines = source.split("\n");
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx] ?? "";
    // Simple tokenizer: split by whitespace and classify
    const parts = line.split(/(\s+)/);
    let col = 0;
    for (const part of parts) {
      if (part === "") { col += part.length; continue; }
      if (/^\s+$/.test(part)) {
        tokens.push({ text: part, type: "plain", line: lineIdx, column: col });
        col += part.length;
        continue;
      }
      let type: CodeToken["type"] = "plain";
      if (keywords.has(part)) type = "keyword";
      else if (/^["'`]/.test(part)) type = "string";
      else if (/^\/\//.test(part) || /^#/.test(part)) type = "comment";
      else if (/^\d/.test(part)) type = "number";
      else if (/^[+\-*/=<>!&|^%]+$/.test(part)) type = "operator";
      tokens.push({ text: part, type, line: lineIdx, column: col });
      col += part.length;
    }
    // Add newline as plain token for line tracking (except last line)
    if (lineIdx < lines.length - 1) {
      tokens.push({ text: "\n", type: "plain", line: lineIdx, column: col });
    }
  }
  return tokens;
}

register(codeModule);
export default codeModule;
