// MiniDiagram — Phase 1 stub reference implementation (Alice)
// Demonstrates module contract + cross-module composition (math-in-diagram).

import type {
  ModuleDescriptor, SemanticModel, RenderContext, RenderResult, RenderHandle, RenderNode,
  MeasureConstraints, MeasureResult,
} from "../MiniRender/core/types";
import { register } from "../MiniRender/core/registry";

interface DiagramNode { id: string; label: string; embed?: { kind: "math"; input: string } | undefined; }
interface DiagramModel extends SemanticModel { kind: "diagram"; nodes: DiagramNode[]; }

export const diagramModule: ModuleDescriptor = {
  id: "diagram",
  name: "MiniDiagram",
  version: "0.0.0-phase1",
  capabilities: ["render:html", "render:svg", "measure:intrinsic", "compose:embed", "a11y:aria"],
  supportedBackends: ["html", "svg"],
  parse(input: unknown): DiagramModel {
    const src = String(input ?? "");
    // Minimal: each line "id: label" becomes a node; "[math: ...]" embeds math.
    const nodes: DiagramNode[] = src.split("\n").filter(Boolean).map((line, i) => {
      const m = line.match(/^(\w+):\s*(.*)$/);
      const id = m && m[1] ? m[1] : `n${i}`;
      const label = m && m[2] ? m[2] : line;
      const em = label.match(/\[math:\s*(.+)\]/);
      const embedInput = em && em[1] ? em[1] : undefined;
      return { id, label: em ? label.replace(em[0], "").trim() : label, embed: embedInput ? { kind: "math" as const, input: embedInput } : undefined };
    });
    return { kind: "diagram", version: 1, nodes };
  },
  render(model: SemanticModel, ctx: RenderContext): RenderResult {
    const m = model as DiagramModel;
    const root: RenderNode = { id: "diagram-root", kind: "group", children: [] };
    const container = document.createElement("div");
    container.className = "mini-diagram";
    for (const n of m.nodes) {
      const nodeEl = document.createElement("div");
      nodeEl.className = "mini-diagram-node";
      nodeEl.textContent = n.label;
      // Cross-module composition: embed math if present
      if (n.embed) {
        const mathMod = (window as any).__mini_registry?.get?.("math");
        if (mathMod) {
          const mathModel = mathMod.parse(n.embed.input);
          const mathRes = mathMod.render(mathModel, ctx);
          root.children!.push({ id: `${n.id}-math`, kind: "foreign", metadata: { handleId: mathRes.handle.id } });
        } else {
          const span = document.createElement("span");
          span.className = "mini-math-fallback";
          span.textContent = n.embed.input;
          nodeEl.appendChild(span);
        }
      }
      container.appendChild(nodeEl);
      root.children!.push({ id: n.id, kind: "element" });
    }
    ctx.container.element.appendChild(container);
    const handle: RenderHandle = {
      id: root.id, kind: "diagram", root,
      update() { /* no-op in stub */ },
      destroy() { container.remove(); },
    };
    return { handle, node: root };
  },
  measure(_model, _ctx): MeasureResult {
    const m = _model as DiagramModel;
    const w = Math.max(120, m.nodes.length * 80);
    const h = m.nodes.length * 24 + 16;
    return { intrinsic: { width: w, height: h }, min: { width: 80, height: 24 }, bbox: { x: 0, y: 0, width: w, height: h } };
  },
};

register(diagramModule);
export default diagramModule;
