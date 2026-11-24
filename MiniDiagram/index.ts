// MiniDiagram — module (Alice). Mermaid-compatible flowchart + basic layered layout + SVG.

import type {
  ModuleKind, MeasureConstraints, MeasureResult, Size, RenderHandle,
} from "../MiniRender/core/types";
import type {
  ModuleDescriptor, SemanticModel, RenderContext, RenderResult, RenderNode,
} from "../MiniRender/core/interfaces";
import { register } from "../MiniRender/core/registry";
import { renderToHTML } from "../MiniMath/index.js";

interface DiagramNode { id: string; label: string; shape: string; x: number; y: number; w: number; h: number; }
interface DiagramEdge { from: string; to: string; label?: string; style: "solid" | "dashed" | "thick" | "dotted"; arrow: boolean; }
interface Subgraph { id: string; title: string; nodes: string[]; }
interface DiagramModel extends SemanticModel { kind: "diagram"; direction: "TD"|"LR"|"BT"|"RL"; nodes: DiagramNode[]; edges: DiagramEdge[]; subgraphs: Subgraph[]; }

function parseNodeToken(tok: string): { id: string; label: string; shape: string } {
  tok = tok.trim();
  const m = tok.match(/^(\w+)(.*)$/);
  const id = m ? m[1]! : tok;
  const rest = m ? m[2]!.trim() : "";
  if (!rest) return { id, label: id, shape: "rect" };
  if (rest.startsWith("([") && rest.endsWith("])")) return { id, label: rest.slice(2, -2), shape: "stadium" };
  if (rest.startsWith("((") && rest.endsWith("))")) return { id, label: rest.slice(2, -2), shape: "circle" };
  if (rest.startsWith("{{") && rest.endsWith("}}")) return { id, label: rest.slice(2, -2), shape: "hexagon" };
  if (rest.startsWith("[/") && rest.endsWith("/]")) return { id, label: rest.slice(2, -2), shape: "parallelogram" };
  if (rest.startsWith("[") && rest.endsWith("]")) return { id, label: rest.slice(1, -1), shape: "rect" };
  if (rest.startsWith("(") && rest.endsWith(")")) return { id, label: rest.slice(1, -1), shape: "round" };
  if (rest.startsWith("{") && rest.endsWith("}")) return { id, label: rest.slice(1, -1), shape: "diamond" };
  if (rest.startsWith(">") && rest.endsWith("]")) return { id, label: rest.slice(1, -1), shape: "rect" };
  if (rest.startsWith("[[") && rest.endsWith("]]")) return { id, label: rest.slice(2, -2), shape: "rect" };
  return { id, label: rest || id, shape: "rect" };
}

export function parseDiagram(source: string): DiagramModel {
  const lines = source.split(/\n/).map(l => l.trim()).filter(Boolean);
  let direction: DiagramModel["direction"] = "TD";
  const nodes = new Map<string, DiagramNode>();
  const edges: DiagramEdge[] = [];
  const subgraphs: Subgraph[] = [];
  let currentSub: Subgraph | null = null;

  const ensureNode = (id: string, label?: string, shape?: string) => {
    if (!nodes.has(id)) {
      nodes.set(id, { id, label: label ?? id, shape: shape ?? "rect", x: 0, y: 0, w: 0, h: 0 });
    } else if (label !== undefined) {
      const n = nodes.get(id)!; n.label = label; if (shape) n.shape = shape;
    }
  };

  for (const line of lines) {
    if (/^(graph|flowchart)\s+(TD|LR|BT|RL|TB)/i.test(line)) {
      const m = line.match(/(TD|LR|BT|RL|TB)/i);
      direction = (m ? m[1]!.toUpperCase() : "TD") as any;
      if ((direction as string) === "TB") direction = "TD";
      continue;
    }
    if (/^subgraph\b/i.test(line)) {
      const title = line.replace(/^subgraph\s*/i, "").trim() || `sg${subgraphs.length}`;
      currentSub = { id: title.replace(/\s+/g, "_"), title, nodes: [] };
      subgraphs.push(currentSub);
      continue;
    }
    if (/^end$/i.test(line)) { currentSub = null; continue; }

    let mEdge = line.match(/^(.+?)(--+>|==+>|-.->|-\.-)(.*)$/);
    if (mEdge) {
      let left = mEdge[1]!.trim();
      const op = mEdge[2]!;
      let right = mEdge[3]!.trim();
      let label: string | undefined;
      const m2 = line.match(/^(.+?)\s*--\s*(.+?)\s*-->\s*(.+)$/);
      if (m2 && !line.includes("|")) {
        left = m2[1]!.trim(); label = m2[2]!.trim(); right = m2[3]!.trim();
      }
      const m3 = right.match(/^\|([^|]*)\|\s*(.+)$/);
      if (m3) { label = m3[1]!.trim(); right = m3[2]!.trim(); }

      const style: DiagramEdge["style"] = op.includes("=") ? "thick" : op.includes("-.") ? "dashed" : "solid";
      const arrow = op.includes(">");

      const leftNode = parseNodeToken(left);
      const rightNode = parseNodeToken(right);
      ensureNode(leftNode.id, leftNode.label, leftNode.shape);
      ensureNode(rightNode.id, rightNode.label, rightNode.shape);
      edges.push({ from: leftNode.id, to: rightNode.id, ...(label !== undefined ? { label } : {}), style, arrow });
      if (currentSub) { if (!currentSub.nodes.includes(leftNode.id)) currentSub.nodes.push(leftNode.id); if (!currentSub.nodes.includes(rightNode.id)) currentSub.nodes.push(rightNode.id); }
      continue;
    }

    const nodeTok = parseNodeToken(line);
    if (nodeTok.id) {
      ensureNode(nodeTok.id, nodeTok.label, nodeTok.shape);
      if (currentSub && !currentSub.nodes.includes(nodeTok.id)) currentSub.nodes.push(nodeTok.id);
    }
  }

  const nodeList = Array.from(nodes.values());
  for (const n of nodeList) {
    n.w = Math.max(60, n.label.length * 8 + 24);
    n.h = 32;
  }
  return { kind: "diagram", version: 1, direction, nodes: nodeList, edges, subgraphs } as DiagramModel;
}

export function layout(model: DiagramModel) {
  const nodes = model.nodes;
  const byId = new Map(nodes.map(n => [n.id, n]));
  const dir = model.direction;
  const horizontal = dir === "LR" || dir === "RL";
  const succ = new Map<string, string[]>();
  const pred = new Map<string, string[]>();
  for (const n of nodes) { succ.set(n.id, []); pred.set(n.id, []); }
  for (const e of model.edges) {
    succ.get(e.from)?.push(e.to);
    pred.get(e.to)?.push(e.from);
  }
  const rank = new Map<string, number>();
  function computeRank(id: string): number {
    if (rank.has(id)) return rank.get(id)!;
    const ps = pred.get(id) ?? [];
    let r = 0;
    for (const p of ps) r = Math.max(r, computeRank(p) + 1);
    rank.set(id, r);
    return r;
  }
  for (const n of nodes) computeRank(n.id);
  const ranks = new Map<number, string[]>();
  for (const n of nodes) {
    const r = rank.get(n.id)!;
    if (!ranks.has(r)) ranks.set(r, []);
    ranks.get(r)!.push(n.id);
  }
  const maxRank = Math.max(...Array.from(ranks.keys()), 0);
  const gapX = horizontal ? 120 : 60;
  const gapY = horizontal ? 60 : 80;
  for (let r = 0; r <= maxRank; r++) {
    const ids = ranks.get(r) ?? [];
    for (let i = 0; i < ids.length; i++) {
      const n = byId.get(ids[i]!)!;
      if (horizontal) {
        n.x = 40 + r * gapX;
        n.y = 40 + i * gapY;
      } else {
        n.x = 40 + i * gapX;
        n.y = 40 + r * gapY;
      }
    }
  }
  // center each rank
  for (let r = 0; r <= maxRank; r++) {
    const ids = ranks.get(r) ?? [];
    if (horizontal) continue;
    const totalW = ids.reduce((s, id) => s + byId.get(id)!.w, 0) + (ids.length - 1) * 20;
    let cx = Math.max(40, (400 - totalW) / 2);
    for (const id of ids) {
      const n = byId.get(id)!;
      n.x = cx;
      cx += n.w + 20;
    }
  }
}

export function renderSVG(model: DiagramModel): string {
  layout(model);
  const nodes = model.nodes;
  const byId = new Map(nodes.map(n => [n.id, n]));
  let maxX = 0, maxY = 0;
  for (const n of nodes) { maxX = Math.max(maxX, n.x + n.w); maxY = Math.max(maxY, n.y + n.h); }
  const w = Math.max(300, maxX + 40);
  const h = Math.max(200, maxY + 40);
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="mini-diagram">`);
  parts.push(`<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>`);
  for (const e of model.edges) {
    const a = byId.get(e.from); const b = byId.get(e.to);
    if (!a || !b) continue;
    const ax = a.x + a.w / 2, ay = a.y + a.h / 2;
    const bx = b.x + b.w / 2, by = b.y + b.h / 2;
    const dash = e.style === "dashed" ? "stroke-dasharray:4,3;" : e.style === "dotted" ? "stroke-dasharray:2,2;" : "";
    const sw = e.style === "thick" ? 2.5 : 1.5;
    const marker = e.arrow ? " marker-end=\"url(#arrow)\"" : "";
    parts.push(`<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="currentColor" stroke-width="${sw}" style="${dash}"${marker}/>`); 
    if (e.label) {
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      parts.push(`<text x="${mx}" y="${my}" text-anchor="middle" font-size="11" fill="currentColor">${escapeXml(e.label)}</text>`);
    }
  }
  for (const n of nodes) {
    const cx = n.x + n.w / 2, cy = n.y + n.h / 2;
    let shapeSvg = "";
    if (n.shape === "round" || n.shape === "stadium") {
      const r = n.shape === "stadium" ? n.h / 2 : 6;
      shapeSvg = `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${r}" ry="${r}" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
    } else if (n.shape === "diamond") {
      const pts = `${cx},${n.y} ${n.x + n.w},${cy} ${cx},${n.y + n.h} ${n.x},${cy}`;
      shapeSvg = `<polygon points="${pts}" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
    } else if (n.shape === "circle") {
      shapeSvg = `<ellipse cx="${cx}" cy="${cy}" rx="${n.w/2}" ry="${n.h/2}" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
    } else {
      shapeSvg = `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="4" ry="4" fill="none" stroke="currentColor" stroke-width="1.5"/>`;
    }
    parts.push(shapeSvg);
    if (/\$/.test(n.label)) {
      const mathHtml = renderToHTML(n.label.replace(/\$/g, ""), { displayMode: false });
      parts.push(`<foreignObject x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}"><div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;align-items:center;justify-content:center;height:100%;font-size:12px">${mathHtml}</div></foreignObject>`);
    } else {
      parts.push(`<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="12" fill="currentColor">${escapeXml(n.label)}</text>`);
    }
  }
  parts.push(`</svg>`);
  return parts.join("");
}

function escapeXml(s: string): string { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

export const diagramModule: ModuleDescriptor = {
  id: "diagram",
  name: "MiniDiagram",
  version: "0.1.0-phase2",
  capabilities: ["render:html", "render:svg", "measure:intrinsic", "compose:embed", "a11y:aria", "export:svg", "export:png", "export:json"],
  supportedBackends: ["html", "svg"],
  parse(input: unknown): DiagramModel {
    return parseDiagram(String(input ?? ""));
  },
  render(model: SemanticModel, ctx: RenderContext): RenderResult {
    const m = model as DiagramModel;
    const node: RenderNode = { id: "diagram-root", kind: "group", children: [] };
    const container = ctx.container.element as HTMLElement;
    const wrapper = document.createElement("div");
    wrapper.className = "mini-diagram";
    wrapper.innerHTML = renderSVG(m);
    container.appendChild(wrapper);
    const handle: RenderHandle = {
      id: node.id,
      update(input) {
        const newModel = parseDiagram(String(input ?? ""));
        m.direction = newModel.direction; m.nodes = newModel.nodes; m.edges = newModel.edges; m.subgraphs = newModel.subgraphs;
        wrapper.innerHTML = renderSVG(m);
      },
      destroy() { wrapper.remove(); },
      async export(format) {
        if (format === "svg" || format === "html") return new Blob([wrapper.innerHTML], { type: "image/svg+xml" });
        return new Blob([]);
      },
    };
    return { handle, node };
  },
  measure(model: SemanticModel, _ctx: RenderContext, constraints?: MeasureConstraints): MeasureResult {
    const m = model as DiagramModel;
    layout(m);
    let maxX = 0, maxY = 0;
    for (const n of m.nodes) { maxX = Math.max(maxX, n.x + n.w); maxY = Math.max(maxY, n.y + n.h); }
    const w = Math.max(120, maxX + 40);
    const h = Math.max(80, maxY + 40);
    return { intrinsic: { width: w, height: h }, min: { width: 80, height: 40 }, bbox: { x: 0, y: 0, width: w, height: h } };
  },
  dispose(instance) { instance.destroy(); },
};

register(diagramModule);
export default diagramModule;
