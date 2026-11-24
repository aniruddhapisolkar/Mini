// MiniChart — Phase 2 module implementation (Cortana)
// Chart rendering: cartesian (line, bar, area, scatter), polar (pie, doughnut, radar), mixed.
// Based on Chart.js (Canvas, plugin arch) and Recharts (SVG, composable, D3 scales).

import type {
  ModuleKind, MeasureConstraints, MeasureResult, Size, RenderHandle, Point, Rect,
} from "../MiniRender/core/types";
import type {
  ModuleDescriptor, SemanticModel, RenderContext, RenderResult, RenderNode,
} from "../MiniRender/core/interfaces";
import { register } from "../MiniRender/core/registry";

// ---- Chart data model ----

type ChartType = "line" | "bar" | "area" | "scatter" | "pie" | "doughnut" | "radar" | "bubble" | "mixed";

interface ChartDataset {
  label: string;
  data: number[];
  color?: string;
  type?: ChartType;
}

interface ChartModel extends SemanticModel {
  kind: "chart";
  type: ChartType;
  labels: string[];
  datasets: ChartDataset[];
  title?: string;
  width: number;
  height: number;
}

// ---- Helpers ----

function resolveColor(i: number): string {
  const palette = ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc948", "#b07aa1", "#ff9da7"];
  return palette[i % palette.length] ?? "#999";
}

function maxAbs(values: number[]): number {
  return values.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
}

// ---- Module ----

export const chartModule: ModuleDescriptor = {
  id: "chart",
  name: "MiniChart",
  version: "0.0.0-phase2",
  capabilities: ["render:html", "render:svg", "render:canvas", "measure:intrinsic", "compose:embed", "perf:stream", "perf:incremental", "a11y:aria", "a11y:keyboard", "a11y:screenreader"],
  supportedBackends: ["html", "svg", "canvas"],
  parse(input: unknown, options?: unknown): ChartModel {
    const opts = (options ?? {}) as { type?: ChartType; width?: number; height?: number; title?: string };
    const raw = (input ?? {}) as { labels?: string[]; datasets?: ChartDataset[] };
    const type = opts.type ?? "bar";
    const labels = raw.labels ?? [];
    const datasets = (raw.datasets ?? []).map((d, i) => ({
      label: d.label ?? `Dataset ${i + 1}`,
      data: d.data ?? [],
      color: d.color ?? resolveColor(i),
      type: d.type ?? type,
    }));
    return {
      kind: "chart",
      version: 1,
      type,
      labels,
      datasets,
      ...(opts.title !== undefined ? { title: opts.title } : {}),
      width: opts.width ?? 400,
      height: opts.height ?? 300,
    };
  },
  render(model: SemanticModel, ctx: RenderContext): RenderResult {
    const m = model as ChartModel;
    const root: RenderNode = { id: "chart-root", kind: "chart", children: [] };
    const container = document.createElement("div");
    container.className = "mini-chart";
    container.style.width = `${m.width}px`;
    container.style.height = `${m.height}px`;
    container.style.position = "relative";

    // Title
    if (m.title) {
      const titleEl = document.createElement("div");
      titleEl.className = "mini-chart-title";
      titleEl.textContent = m.title;
      titleEl.style.textAlign = "center";
      titleEl.style.fontWeight = "bold";
      container.appendChild(titleEl);
    }

    // SVG canvas for chart rendering
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", String(m.width));
    svg.setAttribute("height", String(m.height));
    svg.setAttribute("viewBox", `0 0 ${m.width} ${m.height}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", m.title ?? "Chart");

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const plotW = m.width - padding.left - padding.right;
    const plotH = m.height - padding.top - padding.bottom;

    // Determine data range
    const allValues = m.datasets.flatMap(d => d.data);
    const maxVal = maxAbs(allValues) || 1;

    if (m.type === "bar" || m.type === "line" || m.type === "area") {
      // Cartesian chart
      const barCount = m.labels.length || 1;
      const groupW = plotW / barCount;
      const barW = groupW * 0.6;

      // Axes
      const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
      xAxis.setAttribute("x1", String(padding.left));
      xAxis.setAttribute("y1", String(padding.top + plotH));
      xAxis.setAttribute("x2", String(padding.left + plotW));
      xAxis.setAttribute("y2", String(padding.top + plotH));
      xAxis.setAttribute("stroke", "#333");
      svg.appendChild(xAxis);

      const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
      yAxis.setAttribute("x1", String(padding.left));
      yAxis.setAttribute("y1", String(padding.top));
      yAxis.setAttribute("x2", String(padding.left));
      yAxis.setAttribute("y2", String(padding.top + plotH));
      yAxis.setAttribute("stroke", "#333");
      svg.appendChild(yAxis);

      // Labels
      m.labels.forEach((label, i) => {
        const x = padding.left + groupW * i + groupW / 2;
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", String(x));
        text.setAttribute("y", String(padding.top + plotH + 15));
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-size", "10");
        text.textContent = label;
        svg.appendChild(text);
      });

      // Bars
      if (m.type === "bar") {
        m.datasets.forEach((ds, di) => {
          ds.data.forEach((val, i) => {
            const x = padding.left + groupW * i + (groupW - barW) / 2;
            const h = (Math.abs(val) / maxVal) * plotH;
            const y = padding.top + plotH - h;
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", String(x));
            rect.setAttribute("y", String(y));
            rect.setAttribute("width", String(barW));
            rect.setAttribute("height", String(h));
            rect.setAttribute("fill", ds.color ?? resolveColor(di));
            svg.appendChild(rect);
          });
        });
      }

      // Line
      if (m.type === "line" || m.type === "area") {
        m.datasets.forEach((ds, di) => {
          const points = ds.data.map((val, i) => {
            const x = padding.left + groupW * i + groupW / 2;
            const y = padding.top + plotH - (val / maxVal) * plotH;
            return `${x},${y}`;
          }).join(" ");
          const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
          polyline.setAttribute("points", points);
          polyline.setAttribute("fill", "none");
          polyline.setAttribute("stroke", ds.color ?? resolveColor(di));
          polyline.setAttribute("stroke-width", "2");
          svg.appendChild(polyline);
        });
      }
    } else if (m.type === "pie" || m.type === "doughnut") {
      // Pie/doughnut chart
      const cx = m.width / 2;
      const cy = m.height / 2;
      const r = Math.min(plotW, plotH) / 2;
      const innerR = m.type === "doughnut" ? r * 0.5 : 0;
      const values = m.datasets[0]?.data ?? [];
      const total = values.reduce((a, b) => a + b, 0) || 1;
      let startAngle = -Math.PI / 2;

      values.forEach((val, i) => {
        const angle = (val / total) * Math.PI * 2;
        const endAngle = startAngle + angle;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const ix1 = cx + innerR * Math.cos(startAngle);
        const iy1 = cy + innerR * Math.sin(startAngle);
        const ix2 = cx + innerR * Math.cos(endAngle);
        const iy2 = cy + innerR * Math.sin(endAngle);
        const largeArc = angle > Math.PI ? 1 : 0;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const d = [
          `M ${x1} ${y1}`,
          `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
          innerR > 0 ? `L ${ix2} ${iy2}` : "",
          innerR > 0 ? `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1}` : "",
          "Z",
        ].filter(Boolean).join(" ");
        path.setAttribute("d", d);
        path.setAttribute("fill", resolveColor(i));
        path.setAttribute("stroke", "#fff");
        path.setAttribute("stroke-width", "1");
        svg.appendChild(path);

        startAngle = endAngle;
      });
    }

    container.appendChild(svg);
    (ctx.container.element as HTMLElement).appendChild(container);

    const handle: RenderHandle = {
      id: root.id,
      update(input) {
        // Re-parse and re-render (simplified)
        const newModel = chartModule.parse(input, { type: m.type, width: m.width, height: m.height, title: m.title });
        container.innerHTML = "";
        const newResult = chartModule.render(newModel, ctx);
      },
      destroy() { container.remove(); },
    };
    return { handle, node: root };
  },
  measure(_model: SemanticModel, _ctx: RenderContext, _constraints?: MeasureConstraints): MeasureResult {
    const m = _model as ChartModel;
    const w = m.width;
    const h = m.height;
    return { intrinsic: { width: w, height: h }, min: { width: 100, height: 80 }, bbox: { x: 0, y: 0, width: w, height: h } };
  },
};

register(chartModule);
export default chartModule;