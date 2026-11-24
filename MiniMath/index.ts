// MiniMath — Phase 1 stub reference implementation (Alice)
// Demonstrates module contract: parse/render/measure + composition.

import type {
  ModuleKind, MeasureConstraints, MeasureResult, Size, RenderHandle,
} from "../MiniRender/core/types";
import type {
  ModuleDescriptor, SemanticModel, RenderContext, RenderResult, RenderNode,
} from "../MiniRender/core/interfaces";
import { register } from "../MiniRender/core/registry";

interface MathModel extends SemanticModel { kind: "math"; latex: string; }

export const mathModule: ModuleDescriptor = {
  id: "math",
  name: "MiniMath",
  version: "0.0.0-phase1",
  capabilities: ["render:html", "render:svg", "measure:intrinsic", "compose:embed", "a11y:aria"],
  supportedBackends: ["html", "svg"],
  parse(input: unknown): MathModel {
    return { kind: "math", version: 1, latex: String(input ?? "") };
  },
  render(model: SemanticModel, ctx: RenderContext): RenderResult {
    const m = model as MathModel;
    const node: RenderNode = { id: `math-${Math.random().toString(36).slice(2)}`, kind: "math", children: [], metadata: { latex: m.latex } };
    // Render a span with the latex text (placeholder typesetting)
    const span = document.createElement("span");
    span.className = "mini-math";
    span.textContent = m.latex;
    span.setAttribute("role", "math");
    span.setAttribute("aria-label", m.latex);
    (ctx.container.element as HTMLElement).appendChild(span);
    const handle: RenderHandle = {
      id: node.id,
      update(input) { span.textContent = String(input ?? ""); },
      destroy() { span.remove(); },
    };
    return { handle, node };
  },
  measure(_model: SemanticModel, _ctx: RenderContext, _constraints?: MeasureConstraints): MeasureResult {
    // Approximate: 0.6em per char width, 1.2em height
    const latex = (_model as MathModel).latex;
    const w = latex.length * 8;
    const h = 16;
    return { intrinsic: { width: w, height: h }, min: { width: 8, height: h }, bbox: { x: 0, y: 0, width: w, height: h }, baseline: h * 0.8 };
  },
};

register(mathModule);
export default mathModule;
