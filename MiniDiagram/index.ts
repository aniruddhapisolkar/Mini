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
interface DiagramModel extends SemanticModel { kind: "diagram"; diagramType: "flowchart" | "sequence" | "mindmap" | "pie" | "gantt" | "state" | "er"; direction: "TD"|"LR"|"BT"|"RL"; nodes: DiagramNode[]; edges: DiagramEdge[]; subgraphs: Subgraph[]; sequence?: { participants: string[]; messages: { from: string; to: string; text: string; style: "solid" | "dashed"; }[]; }; pie?: { title: string; slices: { label: string; value: number }[]; }; gantt?: { title: string; tasks: { name: string; id: string; start: number; duration: number }[]; }; er?: { entities: string[]; relations: { from: string; to: string; label: string; cardinality: string }[]; }; }

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
  const trimmed = source.trim();
  if (/^stateDiagram\b/i.test(trimmed)) {
    // strip keyword and parse as flowchart, marking [*] as start/end states
    const body = trimmed.replace(/^stateDiagram(?:-v2)?\s*\n?/i, "");
    const m = parseDiagram("graph TD\n" + body);
    m.diagramType = "state";
    // mark [*] nodes
    for (const n of m.nodes) {
      if (n.label === "[*]" || n.id === "[*]") { n.shape = "circle"; n.label = ""; n.w = 20; n.h = 20; }
    }
    return m;
  }
  if (/^erDiagram\b/i.test(trimmed)) {
    return parseErDiagram(trimmed);
  }
  if (/^gantt\b/i.test(trimmed)) {
    return parseGanttDiagram(trimmed);
  }
  if (/^pie\b/i.test(trimmed)) {
    return parsePieDiagram(trimmed);
  }
  if (/^mindmap\b/i.test(trimmed)) {
    return parseMindmapDiagram(trimmed);
  }
  if (/^sequenceDiagram\b/i.test(trimmed)) {
    return parseSequenceDiagram(trimmed);
  }
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
  return { kind: "diagram", version: 1, diagramType: "flowchart", direction, nodes: nodeList, edges, subgraphs } as DiagramModel;
}

export function parseMindmapDiagram(source: string): DiagramModel {
  const lines = source.split(/\n/).map(l => l.trimEnd()).filter(l => l.trim().length > 0);
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const stack: { indent: number; id: string }[] = [];
  let idx = 0;
  for (const raw of lines) {
    if (/^mindmap\b/i.test(raw.trim())) continue;
    const indent = raw.length - raw.trimStart().length;
    const label = raw.trim().replace(/^[-*]\s*/, "");
    const id = `m${idx++}`;
    nodes.push({ id, label, shape: "round", x: 0, y: 0, w: Math.max(60, label.length * 8 + 24), h: 32 });
    // find parent
    while (stack.length > 0 && stack[stack.length-1]!.indent >= indent) stack.pop();
    if (stack.length) {
      edges.push({ from: stack[stack.length-1]!.id, to: id, style: "solid", arrow: false });
    }
    stack.push({ indent, id });
  }
  return { kind: "diagram", version: 1, diagramType: "mindmap", direction: "TD", layout: "tree", nodes, edges, subgraphs: [] } as DiagramModel;
}

export function parsePieDiagram(source: string): DiagramModel {
  const lines = source.split(/\n/).map(l => l.trim()).filter(Boolean);
  const slices: { label: string; value: number }[] = [];
  let title = "";
  for (const line of lines) {
    if (/^pie\b/i.test(line)) continue;
    const tm = line.match(/^title\s+(.+)$/i); if (tm) { title = tm[1]!.trim(); continue; }
    const m = line.match(/^"([^"]+)"\s*:\s*([\d.]+)$/);
    if (m) slices.push({ label: m[1]!, value: parseFloat(m[2]!) });
  }
  return { kind: "diagram", version: 1, diagramType: "pie", direction: "TD", layout: "layered", nodes: [], edges: [], subgraphs: [], pie: { title, slices } } as any;
}

export function parseGanttDiagram(source: string): DiagramModel {
  const lines = source.split(/\n/).map(l => l.trim()).filter(Boolean);
  const tasks: { name: string; id: string; start: number; duration: number }[] = [];
  let title = "";
  const idStart = new Map<string, number>();
  let cursor = 0;
  for (const line of lines) {
    if (/^gantt\b/i.test(line)) continue;
    const tm = line.match(/^title\s+(.+)$/i); if (tm) { title = tm[1]!.trim(); continue; }
    if (/^(dateFormat|axisFormat|section)\b/i.test(line)) continue;
    // task line: "name :id, start, duration" or "name : id, after x, 20d"
    const m = line.match(/^(.+?)\s*:\s*(.+)$/);
    if (!m) continue;
    const name = m[1]!.trim();
    const rest = m[2]!.trim();
    const parts = rest.split(",").map(p => p.trim());
    const id = parts[0] || `t${tasks.length}`;
    let start = 0;
    let duration = 1;
    if (parts.length >= 3) {
      const s = parts[1]!;
      if (/^after\s+/i.test(s)) {
        const ref = s.replace(/^after\s+/i, "").trim();
        start = idStart.get(ref) ?? cursor;
      } else if (/^\d+$/.test(s)) {
        start = parseInt(s, 10);
      }
      const durStr = parts[2]!;
      const dm = durStr.match(/(\d+)d?/);
      if (dm) duration = parseInt(dm[1]!, 10);
    } else if (parts.length === 2) {
      const durStr = parts[1]!;
      const dm = durStr.match(/(\d+)d?/);
      if (dm) duration = parseInt(dm[1]!, 10);
    }
    tasks.push({ name, id, start, duration });
    idStart.set(id, start + duration);
    cursor = Math.max(cursor, start + duration);
  }
  return { kind: "diagram", version: 1, diagramType: "gantt", direction: "TD", layout: "layered", nodes: [], edges: [], subgraphs: [], gantt: { title, tasks } } as any;
}

export function parseErDiagram(source: string): DiagramModel {
  const lines = source.split(/\n/).map(l => l.trim()).filter(Boolean);
  const entities = new Set<string>();
  const relations: { from: string; to: string; label: string; cardinality: string }[] = [];
  for (const line of lines) {
    if (/^erDiagram\b/i.test(line)) continue;
    const m = line.match(/^(\w+)\b.*?\b(\w+)\s*:\s*(.+)$/);
    if (m) {
      const from = m[1]!, to = m[2]!;
      entities.add(from); entities.add(to);
      relations.push({ from, to, label: m[3]!.trim(), cardinality: "" });
      continue;
    }
    const em = line.match(/^(\w+)\s*\{/); if (em) { entities.add(em[1]!); continue; }
  }
  for (const r of relations) { entities.add(r.from); entities.add(r.to); }
  const nodeList = Array.from(entities).map((e) => ({ id: e, label: e, shape: "rect", x: 0, y: 0, w: Math.max(80, e.length*8+24), h: 32 }));
  const edges: DiagramEdge[] = relations.map(r => ({ from: r.from, to: r.to, label: r.label, style: "solid" as const, arrow: true }));
  return { kind: "diagram", version: 1, diagramType: "er", direction: "TD", layout: "layered", nodes: nodeList, edges, subgraphs: [], er: { entities: Array.from(entities), relations } } as any;
}

export function parseSequenceDiagram(source: string): DiagramModel {
  const lines = source.split(/\n/).map(l => l.trim()).filter(Boolean);
  const participants: string[] = [];
  const messages: { from: string; to: string; text: string; style: "solid" | "dashed"; }[] = [];
  const ensureP = (name: string) => { if (!participants.includes(name)) participants.push(name); };
  for (const line of lines) {
    if (/^sequenceDiagram/i.test(line)) continue;
    let m = line.match(/^participant\s+(\S+)(?:\s+as\s+(.+))?$/i);
    if (m) { ensureP(m[1]!); continue; }
    m = line.match(/^(\S+?)\s*(-->>?|->>|-->|--x|-x)\s*(\S+?)\s*:\s*(.*)$/);
    if (m) {
      const from = m[1]!; const to = m[3]!;
      const style = m[2]!.includes("--") ? "dashed" : "solid";
      ensureP(from); ensureP(to);
      messages.push({ from, to, text: m[4]!.trim(), style });
      continue;
    }
    m = line.match(/^Note\s+(?:over|left of|right of)\s+([^:]+):\s*(.*)$/i);
    if (m) { /* notes ignored in minimal renderer */ continue; }
    m = line.match(/^activate\s+(\S+)/i); if (m) { ensureP(m[1]!); continue; }
    m = line.match(/^deactivate\s+(\S+)/i); if (m) { continue; }
  }
  if (participants.length === 0 && messages.length > 0) {
    // derive from messages
  }
  return { kind: "diagram", version: 1, diagramType: "sequence", direction: "TD", nodes: [], edges: [], subgraphs: [], sequence: { participants, messages } } as DiagramModel;
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
  const visiting = new Set<string>();
  function computeRank(id: string): number {
    if (rank.has(id)) return rank.get(id)!;
    if (visiting.has(id)) return 0; // cycle
    visiting.add(id);
    const ps = pred.get(id) ?? [];
    let r = 0;
    for (const p of ps) r = Math.max(r, computeRank(p) + 1);
    visiting.delete(id);
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
  if (model.diagramType === "sequence") return renderSequenceSVG(model);
  if (model.diagramType === "pie") return renderPieSVG(model);
  if (model.diagramType === "gantt") return renderGanttSVG(model);
  if (model.diagramType === "er") return renderErSVG(model);
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

function renderSequenceSVG(model: DiagramModel): string {
  const seq = model.sequence!;
  const participants = seq.participants;
  const n = participants.length;
  const colW = 140;
  const w = Math.max(300, n * colW + 40);
  const msgH = 40;
  const top = 60;
  const h = Math.max(200, top + seq.messages.length * msgH + 60);
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="mini-diagram mini-sequence">`);
  // participant boxes + lifelines
  const xOf = (name: string) => 40 + participants.indexOf(name) * colW + colW / 2;
  for (let i = 0; i < n; i++) {
    const x = 40 + i * colW + colW / 2;
    parts.push(`<rect x="${x-40}" y="10" width="80" height="30" rx="4" ry="4" fill="none" stroke="currentColor" stroke-width="1.5"/>`);
    parts.push(`<text x="${x}" y="30" text-anchor="middle" font-size="12" fill="currentColor">${escapeXml(participants[i]!)}</text>`);
    parts.push(`<line x1="${x}" y1="40" x2="${x}" y2="${h-10}" stroke="currentColor" stroke-width="1" stroke-dasharray="4,3"/>`);
  }
  // messages
  let y = top;
  for (const msg of seq.messages) {
    const x1 = xOf(msg.from), x2 = xOf(msg.to);
    const dash = msg.style === "dashed" ? "stroke-dasharray:4,3;" : "";
    const marker = msg.from !== msg.to ? " marker-end=\"url(#arrow)\"" : "";
    parts.push(`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="currentColor" stroke-width="1.5" style="${dash}"${marker}/>`); 
    if (msg.text) {
      const mx = (x1 + x2) / 2;
      parts.push(`<text x="${mx}" y="${y - 6}" text-anchor="middle" font-size="11" fill="currentColor">${escapeXml(msg.text)}</text>`);
    }
    y += msgH;
  }
  parts.push(`</svg>`);
  return parts.join("");
}

function renderPieSVG(model: any): string {
  const pie = model.pie;
  const slices = pie.slices as { label: string; value: number }[];
  const total = slices.reduce((s: number, sl: any) => s + sl.value, 0) || 1;
  const w = 320, h = 260;
  const cx = w/2, cy = h/2 + 10, r = 90;
  const colors = ["#4e79a7","#f28e2b","#e15759","#76b7b2","#59a14f","#edc948","#b07aa1","#ff9da7","#9c755f","#bab0ac"];
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="mini-diagram mini-pie">`);
  if (pie.title) parts.push(`<text x="${w/2}" y="20" text-anchor="middle" font-size="14" fill="currentColor">${escapeXml(pie.title)}</text>`);
  let angle = -Math.PI/2;
  slices.forEach((sl, i) => {
    const frac = sl.value / total;
    const a2 = angle + frac * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const large = frac > 0.5 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    parts.push(`<path d="${d}" fill="${colors[i % colors.length]}" stroke="white" stroke-width="1"/>`);
    // label
    const mid = angle + frac * Math.PI;
    const lx = cx + (r+15) * Math.cos(mid), ly = cy + (r+15) * Math.sin(mid);
    parts.push(`<text x="${lx}" y="${ly}" font-size="10" fill="currentColor" text-anchor="middle">${escapeXml(sl.label)}</text>`);
    angle = a2;
  });
  parts.push(`</svg>`);
  return parts.join("");
}

function renderGanttSVG(model: any): string {
  const g = model.gantt;
  const tasks = g.tasks as { name: string; id: string; start: number; duration: number }[];
  const total = Math.max(...tasks.map((t: any) => t.start + t.duration), 1);
  const rowH = 24, leftW = 120, barArea = 400;
  const w = leftW + barArea + 20;
  const h = 40 + tasks.length * rowH + 20;
  const scale = barArea / Math.max(1, total);
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="mini-diagram mini-gantt">`);
  if (g.title) parts.push(`<text x="${w/2}" y="20" text-anchor="middle" font-size="14" fill="currentColor">${escapeXml(g.title)}</text>`);
  tasks.forEach((t, i) => {
    const y = 30 + i * rowH;
    parts.push(`<text x="8" y="${y + 16}" font-size="11" fill="currentColor">${escapeXml(t.name)}</text>`);
    const x = leftW + t.start * scale;
    const bw = Math.max(2, t.duration * scale);
    parts.push(`<rect x="${x}" y="${y}" width="${bw}" height="${rowH-4}" rx="3" ry="3" fill="steelblue" stroke="none"/>`);
    parts.push(`<text x="${x + 4}" y="${y + 15}" font-size="10" fill="white">${escapeXml(t.id)}</text>`);
  });
  parts.push(`</svg>`);
  return parts.join("");
}

function renderErSVG(model: any): string {
  const er = model.er;
  const nodes = model.nodes;
  const byId = new Map(nodes.map((n: any) => [n.id, n]));
  layout(model);
  let maxX = 0, maxY = 0;
  for (const n of nodes) { maxX = Math.max(maxX, n.x + n.w); maxY = Math.max(maxY, n.y + n.h); }
  const w = Math.max(200, maxX + 40);
  const h = Math.max(120, maxY + 40);
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="mini-diagram mini-er">`);
  for (const e of er.relations) {
    const a = byId.get(e.from) as any, b = byId.get(e.to) as any;
    if (!a || !b) continue;
    const ax = a.x + a.w/2, ay = a.y + a.h/2;
    const bx = b.x + b.w/2, by = b.y + b.h/2;
    parts.push(`<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="currentColor" stroke-width="1.5" marker-end="url(#arrow)"/>`);
    if (e.label) {
      const mx = (ax+bx)/2, my = (ay+by)/2;
      parts.push(`<text x="${mx}" y="${my-4}" text-anchor="middle" font-size="10" fill="currentColor">${escapeXml(e.label)}</text>`);
    }
  }
  for (const n of nodes) {
    parts.push(`<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="4" ry="4" fill="none" stroke="currentColor" stroke-width="1.5"/>`);
    parts.push(`<text x="${n.x + n.w/2}" y="${n.y + n.h/2 + 4}" text-anchor="middle" font-size="12" fill="currentColor">${escapeXml(n.label)}</text>`);
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
    if (m.diagramType === "er") {
      layout(m);
      let maxX = 0, maxY = 0;
      for (const n of m.nodes) { maxX = Math.max(maxX, n.x + n.w); maxY = Math.max(maxY, n.y + n.h); }
      const w = Math.max(200, maxX + 40);
      const h = Math.max(120, maxY + 40);
      return { intrinsic: { width: w, height: h }, min: { width: 120, height: 60 }, bbox: { x: 0, y: 0, width: w, height: h } };
    }
    if (m.diagramType === "gantt") {
      const tasks = (m as any).gantt?.tasks ?? [];
      const total = Math.max(...tasks.map((t: any) => t.start + t.duration), 1);
      const w = 120 + 400 + 20;
      const h = 40 + tasks.length * 24 + 20;
      return { intrinsic: { width: w, height: h }, min: { width: 200, height: 60 }, bbox: { x: 0, y: 0, width: w, height: h } };
    }
    if (m.diagramType === "pie") {
      return { intrinsic: { width: 320, height: 260 }, min: { width: 200, height: 160 }, bbox: { x: 0, y: 0, width: 320, height: 260 } };
    }
    if (m.diagramType === "sequence") {
      const seq = m.sequence!;
      const w = Math.max(120, seq.participants.length * 140 + 40);
      const h = Math.max(80, 60 + seq.messages.length * 40 + 60);
      return { intrinsic: { width: w, height: h }, min: { width: 80, height: 40 }, bbox: { x: 0, y: 0, width: w, height: h } };
    }
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
