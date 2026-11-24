successfully downloaded text file (SHA: f955474caea05836b5630389afc34dae260f695e)
// MiniText — Phase 1 stub reference implementation (Jimbo)
// Demonstrates module contract: parse/render/measure + streaming + composition.

import type {
  ModuleDescriptor, SemanticModel, RenderContext, RenderResult, RenderHandle, RenderNode,
  MeasureConstraints, MeasureResult, Size, Span,
} from "../MiniRender/core/types";
import { register } from "../MiniRender/core/registry";
import { TextProcessor, Typography, sanitizeHtml } from "../MiniRender/text/index";

interface TextNode {
  type: "paragraph" | "heading" | "code" | "math" | "list" | "blockquote";
  content: string;
  level?: number;
  embed?: { kind: "code" | "math" | "diagram" | "chart" | "table"; input: string; options?: Record<string, unknown> } | undefined;
}

interface TextModel extends SemanticModel {
  kind: "text";
  blocks: TextNode[];
  raw: string;
}

export const textModule: ModuleDescriptor = {
  id: "text",
  name: "MiniText",
  version: "0.0.0-phase1",
  capabilities: ["render:html", "render:svg", "measure:intrinsic", "compose:embed", "perf:stream", "perf:incremental", "a11y:aria", "a11y:keyboard", "a11y:screenreader"],
  supportedBackends: ["html", "svg"],
  parse(input: unknown): TextModel {
    const src = String(input ?? "");
    const normalized = TextProcessor.process(src, { normalizeLineEndings: true });
    const lines = normalized.split("\n");
    const blocks: TextNode[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i] ?? "";
      if (line.startsWith("# ")) {
        blocks.push({ type: "heading", content: line.slice(2), level: 1 });
        i++;
      } else if (line.startsWith("## ")) {
        blocks.push({ type: "heading", content: line.slice(3), level: 2 });
        i++;
      } else if (line.startsWith("```")) {
        const lang = line.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
          codeLines.push(lines[i] ?? "");
          i++;
        }
        i++; // skip closing fence
        blocks.push({ type: "code", content: codeLines.join("\n"), embed: { kind: "code", input: codeLines.join("\n"), options: { language: lang || "text" } } });
      } else if (line.startsWith("> ")) {
        blocks.push({ type: "blockquote", content: line.slice(2) });
        i++;
      } else if (line.trim() === "") {
        i++;
      } else {
        blocks.push({ type: "paragraph", content: line });
        i++;
      }
    }
    return { kind: "text", version: 1, blocks, raw: src };
  },
  render(model: SemanticModel, ctx: RenderContext): RenderResult {
    const m = model as TextModel;
    const root: RenderNode = { id: "text-root", kind: "group", children: [] };
    const container = document.createElement("div");
    container.className = "mini-text";

    for (const block of m.blocks) {
      const el = document.createElement("div");
      switch (block.type) {
        case "heading": {
          const h = document.createElement(`h${block.level ?? 1}`);
          h.className = "mini-text-heading";
          h.textContent = Typography.apply(block.content);
          el.appendChild(h);
          break;
        }
        case "paragraph": {
          const p = document.createElement("p");
          p.className = "mini-text-paragraph";
          p.innerHTML = sanitizeHtml(TextProcessor.escapeHtml(Typography.apply(block.content)));
          el.appendChild(p);
          break;
        }
        case "code": {
          const pre = document.createElement("pre");
          const code = document.createElement("code");
          code.className = "mini-code-block";
          code.textContent = block.content;
          pre.appendChild(code);
          // Cross-module: try to embed MiniCode
          if (block.embed) {
            const codeMod = (globalThis as any).__mini_registry?.get?.("code");
            if (codeMod) {
              const codeModel = codeMod.parse(block.content);
              const codeRes = codeMod.render(codeModel, ctx);
              root.children!.push({ id: `${block.type}-${root.children!.length}`, kind: "foreign", metadata: { handleId: codeRes.handle.id } });
            }
          }
          el.appendChild(pre);
          break;
        }
        case "blockquote": {
          const bq = document.createElement("blockquote");
          bq.className = "mini-text-blockquote";
          bq.textContent = Typography.apply(block.content);
          el.appendChild(bq);
          break;
        }
      }
      container.appendChild(el);
      root.children!.push({ id: `block-${root.children!.length}`, kind: "element" });
    }

    (ctx.container.element as HTMLElement).appendChild(container);
    const handle: RenderHandle = {
      id: root.id,
      update(input) {
        // Re-parse and re-render (simplified; full impl uses incremental)
        container.innerHTML = "";
        const newModel = textModule.parse(input);
        const newResult = textModule.render(newModel, ctx);
        // Replace content (simplified)
      },
      destroy() { container.remove(); },
    };
    return { handle, node: root };
  },
  measure(_model, _ctx, _constraints?): MeasureResult {
    const m = _model as TextModel;
    const lines = m.blocks.length;
    const w = 600;
    const h = lines * 24 + 16;
    return { intrinsic: { width: w, height: h }, min: { width: 200, height: 24 }, bbox: { x: 0, y: 0, width: w, height: h } };
  },
};

register(textModule);
export default textModule;
export { TextProcessor, Typography, sanitizeHtml } from "../MiniRender/text/index";
