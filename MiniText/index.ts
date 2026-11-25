// MiniText — module implementation (Phase 2)

import type {
  ModuleDescriptor, SemanticModel, RenderContext, RenderResult, RenderNode,
} from "../MiniRender/core/interfaces.js";
import type { RenderHandle, MeasureConstraints, MeasureResult } from "../MiniRender/core/types.js";
import { register } from "../MiniRender/core/registry.js";
import { parseMarkdown, parseInlines } from "./parser.js";
import type { TextDocument } from "./types.js";
import { renderDocument, renderBlocksArray } from "./render.js";
import { sanitizeHtml } from "../MiniRender/text/index.js";

interface TextModel extends SemanticModel {
  kind: "text";
  document: TextDocument;
  raw: string;
}

export const textModule: ModuleDescriptor = {
  id: "text",
  name: "MiniText",
  version: "0.1.0-phase2",
  capabilities: [
    "render:html", "render:svg", "measure:intrinsic", "compose:embed",
    "perf:stream", "perf:incremental", "a11y:aria", "a11y:keyboard", "a11y:screenreader",
  ],
  supportedBackends: ["html", "svg"],
  parse(input: unknown, options?: unknown): TextModel {
    const src = String(input ?? "");
    const opts = (options ?? {}) as Record<string, unknown>;
    const document = parseMarkdown(src, opts as any);
    return { kind: "text", version: 1, document, raw: src, metadata: opts };
  },
  render(model: SemanticModel, ctx: RenderContext): RenderResult {
    const m = model as unknown as TextModel;
    const root: RenderNode = { id: "text-root", kind: "group", children: [] };
    const container = (ctx.container.element as HTMLElement);

    const blockHtmls = renderBlocksArray(m.document.children, { sanitize: true, typography: false });
    const wrapper = document.createElement("div");
    wrapper.className = "mini-text";
    const blockEls: HTMLElement[] = [];
    for (const h of blockHtmls) {
      const el = document.createElement("div");
      el.className = "mini-text-block";
      el.innerHTML = h;
      wrapper.appendChild(el);
      blockEls.push(el);
    }
    container.appendChild(wrapper);

    const handle: RenderHandle = {
      id: root.id,
      update(input) {
        const newModel = textModule.parse(input, model.metadata) as unknown as TextModel;
        const newBlockHtmls = renderBlocksArray(newModel.document.children, { sanitize: true });
        // Incremental: reuse unchanged blocks, replace changed ones
        const maxLen = Math.max(blockEls.length, newBlockHtmls.length);
        for (let idx = 0; idx < maxLen; idx++) {
          const newH = newBlockHtmls[idx];
          const oldEl = blockEls[idx];
          if (newH === undefined) {
            // removed
            if (oldEl) { oldEl.remove(); blockEls.splice(idx, 1); idx--; }
            continue;
          }
          if (oldEl && oldEl.innerHTML === newH) continue; // unchanged
          if (oldEl) {
            oldEl.innerHTML = newH;
          } else {
            const el = document.createElement("div");
            el.className = "mini-text-block";
            el.innerHTML = newH;
            wrapper.appendChild(el);
            blockEls.push(el);
          }
        }
      },
      destroy() { wrapper.remove(); },
    };
    return { handle, node: root };
  },
  measure(model, _ctx, _constraints?: MeasureConstraints): MeasureResult {
    const m = model as unknown as TextModel;
    // rough estimate: count blocks
    const blocks = m.document.children.length;
    const w = 640;
    const h = Math.max(24, blocks * 22);
    return { intrinsic: { width: w, height: h }, min: { width: 200, height: 24 }, bbox: { x: 0, y: 0, width: w, height: h } };
  },
};

register(textModule);
export default textModule;

// Re-exports
export { parseMarkdown, parseInlines } from "./parser.js";
export type { TextDocument, BlockNode, InlineNode } from "./types.js";
export { renderDocument, renderBlocks } from "./render.js";
export { textModule as miniText };
export { createTextStream } from "./stream.js";
export type { TextStreamController } from "./stream.js";
