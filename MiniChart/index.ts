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

type ChartType = "line" | "bar" | "bar-horizontal" | "area" | "scatter" | "pie" | "doughnut" | "radar" | "bubble" | "mixed";

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
  xAxisLabel?: string;
  yAxisLabel?: string;
  donutRatio?: number;
  legendPosition?: "top" | "bottom" | "left" | "right";
  stacked?: boolean;
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
    const opts = (options ?? {}) as { type?: ChartType; width?: number; height?: number; title?: string; xAxisLabel?: string; yAxisLabel?: string; donutRatio?: number; legendPosition?: "top" | "bottom" | "left" | "right"; stacked?: boolean };
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
      ...(opts.xAxisLabel !== undefined ? { xAxisLabel: opts.xAxisLabel } : {}),
      ...(opts.yAxisLabel !== undefined ? { yAxisLabel: opts.yAxisLabel } : {}),
      ...(opts.donutRatio !== undefined ? { donutRatio: opts.donutRatio } : {}),
      ...(opts.legendPosition !== undefined ? { legendPosition: opts.legendPosition } : {}),
      ...(opts.stacked !== undefined ? { stacked: opts.stacked } : {}),
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
    // Dark mode support via CSS variables
    container.style.setProperty("--mini-chart-bg", "var(--mini-bg, #fff)");
    container.style.setProperty("--mini-chart-text", "var(--mini-text, #333)");
    container.style.setProperty("--mini-chart-grid", "var(--mini-grid, #eee)");

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

    if (m.type === "bar" || m.type === "bar-horizontal" || m.type === "line" || m.type === "area") {
      // Cartesian chart
      const barCount = m.labels.length || 1;
      const groupW = plotW / barCount;
      const barW = groupW * 0.6;

      // Grid lines
      const gridCount = 5;
      for (let g = 0; g <= gridCount; g++) {
        const y = padding.top + (plotH / gridCount) * g;
        const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        gridLine.setAttribute("x1", String(padding.left));
        gridLine.setAttribute("y1", String(y));
        gridLine.setAttribute("x2", String(padding.left + plotW));
        gridLine.setAttribute("y2", String(y));
        gridLine.setAttribute("stroke", "#eee");
        gridLine.setAttribute("stroke-width", "1");
        svg.appendChild(gridLine);

        // Y-axis tick label
        const tickVal = maxVal * (1 - g / gridCount);
        const tickText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        tickText.setAttribute("x", String(padding.left - 5));
        tickText.setAttribute("y", String(y + 4));
        tickText.setAttribute("text-anchor", "end");
        tickText.setAttribute("font-size", "9");
        tickText.textContent = tickVal.toFixed(0);
        svg.appendChild(tickText);
      }

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

      // X-axis label
      if (m.xAxisLabel) {
        const xLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        xLabel.setAttribute("x", String(padding.left + plotW / 2));
        xLabel.setAttribute("y", String(m.height - 5));
        xLabel.setAttribute("text-anchor", "middle");
        xLabel.setAttribute("font-size", "11");
        xLabel.textContent = m.xAxisLabel;
        svg.appendChild(xLabel);
      }

      // Y-axis label
      if (m.yAxisLabel) {
        const yLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        yLabel.setAttribute("x", String(12));
        yLabel.setAttribute("y", String(padding.top + plotH / 2));
        yLabel.setAttribute("text-anchor", "middle");
        yLabel.setAttribute("font-size", "11");
        yLabel.setAttribute("transform", `rotate(-90, 12, ${padding.top + plotH / 2})`);
        yLabel.textContent = m.yAxisLabel;
        svg.appendChild(yLabel);
      }

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
        if (m.stacked) {
          // Stacked bars
          m.labels.forEach((label, i) => {
            let yOffset = 0;
            m.datasets.forEach((ds, di) => {
              const val = ds.data[i] ?? 0;
              const h = (Math.abs(val) / maxVal) * plotH;
              const x = padding.left + groupW * i + (groupW - barW) / 2;
              const y = padding.top + plotH - yOffset - h;
              const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
              rect.setAttribute("x", String(x));
              rect.setAttribute("y", String(y));
              rect.setAttribute("width", String(barW));
              rect.setAttribute("height", String(h));
              rect.setAttribute("fill", ds.color ?? resolveColor(di));
              rect.setAttribute("data-value", String(val));
              svg.appendChild(rect);
              yOffset += h;
            });
          });
        } else {
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
              rect.setAttribute("data-value", String(val));
              svg.appendChild(rect);
            });
          });
        }
      }

      // Horizontal bars
      if (m.type === "bar-horizontal") {
        const barH = groupW * 0.6;
        m.datasets.forEach((ds, di) => {
          ds.data.forEach((val, i) => {
            const y = padding.top + groupW * i + (groupW - barH) / 2;
            const w = (Math.abs(val) / maxVal) * plotW;
            const x = padding.left;
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", String(x));
            rect.setAttribute("y", String(y));
            rect.setAttribute("width", String(w));
            rect.setAttribute("height", String(barH));
            rect.setAttribute("fill", ds.color ?? resolveColor(di));
            rect.setAttribute("data-value", String(val));
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
    } else if (m.type === "bubble") {
      // Bubble chart
      m.datasets.forEach((ds, di) => {
        ds.data.forEach((val, i) => {
          const bubbleSize = Math.abs(val) * 2 + 4;
          const x = padding.left + (i / (ds.data.length - 1 || 1)) * plotW;
          const y = padding.top + plotH - (val / maxVal) * plotH;
          const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          circle.setAttribute("cx", String(x));
          circle.setAttribute("cy", String(y));
          circle.setAttribute("r", String(bubbleSize));
          circle.setAttribute("fill", (ds.color ?? resolveColor(di)) + "66");
          circle.setAttribute("stroke", ds.color ?? resolveColor(di));
          circle.setAttribute("stroke-width", "1");
          svg.appendChild(circle);
        });
      });
    } else if (m.type === "mixed") {
      // Mixed chart: render each dataset according to its type
      const barCount = m.labels.length || 1;
      const groupW = plotW / barCount;
      const barW = groupW * 0.6;
      m.datasets.forEach((ds, di) => {
        const chartType = ds.type ?? "bar";
        if (chartType === "bar") {
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
        } else if (chartType === "line" || chartType === "area") {
          const points = ds.data.map((val, i) => {
            const x = padding.left + groupW * i + groupW / 2;
            const y = padding.top + plotH - (val / maxVal) * plotH;
            return `${x},${y}`;
          }).join(" ");
          const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
          polyline.setAttribute("points", points);
          polyline.setAttribute("fill", chartType === "area" ? (ds.color ?? resolveColor(di)) + "33" : "none");
          polyline.setAttribute("stroke", ds.color ?? resolveColor(di));
          polyline.setAttribute("stroke-width", "2");
          svg.appendChild(polyline);
        }
      });
    } else if (m.type === "scatter") {
      // Scatter chart
      m.datasets.forEach((ds, di) => {
        ds.data.forEach((val, i) => {
          const x = padding.left + (i / (ds.data.length - 1 || 1)) * plotW;
          const y = padding.top + plotH - (val / maxVal) * plotH;
          const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          circle.setAttribute("cx", String(x));
          circle.setAttribute("cy", String(y));
          circle.setAttribute("r", "4");
          circle.setAttribute("fill", ds.color ?? resolveColor(di));
          svg.appendChild(circle);
        });
      });
    } else if (m.type === "radar") {
      // Radar chart
      const cx = m.width / 2;
      const cy = m.height / 2;
      const r = Math.min(plotW, plotH) / 2;
      const n = m.labels.length || 1;
      // Draw axes
      m.labels.forEach((label, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String(cx));
        line.setAttribute("y1", String(cy));
        line.setAttribute("x2", String(x));
        line.setAttribute("y2", String(y));
        line.setAttribute("stroke", "#ccc");
        svg.appendChild(line);
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", String(x + 5));
        text.setAttribute("y", String(y));
        text.setAttribute("font-size", "10");
        text.textContent = label;
        svg.appendChild(text);
      });
      // Draw data polygon
      m.datasets.forEach((ds, di) => {
        const points = ds.data.map((val, i) => {
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          const rr = (val / maxVal) * r;
          return `${cx + rr * Math.cos(angle)},${cy + rr * Math.sin(angle)}`;
        }).join(" ");
        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygon.setAttribute("points", points);
        polygon.setAttribute("fill", (ds.color ?? resolveColor(di)) + "33");
        polygon.setAttribute("stroke", ds.color ?? resolveColor(di));
        polygon.setAttribute("stroke-width", "2");
        svg.appendChild(polygon);
      });
    } else if (m.type === "pie" || m.type === "doughnut") {
      // Pie/doughnut chart
      const cx = m.width / 2;
      const cy = m.height / 2;
      const r = Math.min(plotW, plotH) / 2;
      const innerR = m.type === "doughnut" ? r * (m.donutRatio ?? 0.5) : 0;
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

      // Pie labels
      if (m.labels.length > 0) {
        let labelAngle = -Math.PI / 2;
        const values = m.datasets[0]?.data ?? [];
        const total = values.reduce((a, b) => a + b, 0) || 1;
        values.forEach((val, i) => {
          const angle = (val / total) * Math.PI * 2;
          const midAngle = labelAngle + angle / 2;
          const labelR = r * 0.7;
          const x = cx + labelR * Math.cos(midAngle);
          const y = cy + labelR * Math.sin(midAngle);
          const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
          text.setAttribute("x", String(x));
          text.setAttribute("y", String(y));
          text.setAttribute("text-anchor", "middle");
          text.setAttribute("font-size", "10");
          text.setAttribute("fill", "#fff");
          text.textContent = m.labels[i] ?? "";
          svg.appendChild(text);
          labelAngle += angle;
        });

        // Pie percentage labels
        labelAngle = -Math.PI / 2;
        values.forEach((val, i) => {
          const angle = (val / total) * Math.PI * 2;
          const midAngle = labelAngle + angle / 2;
          const labelR = r * 0.4;
          const x = cx + labelR * Math.cos(midAngle);
          const y = cy + labelR * Math.sin(midAngle);
          const pctText = document.createElementNS("http://www.w3.org/2000/svg", "text");
          pctText.setAttribute("x", String(x));
          pctText.setAttribute("y", String(y));
          pctText.setAttribute("text-anchor", "middle");
          pctText.setAttribute("font-size", "9");
          pctText.setAttribute("fill", "#fff");
          pctText.textContent = `${Math.round((val / total) * 100)}%`;
          svg.appendChild(pctText);
          labelAngle += angle;
        });
      }
    }

    // Legend for multi-dataset charts
    if (m.datasets.length > 1) {
      const legendY = m.height - 12;
      m.datasets.forEach((ds, i) => {
        const x = padding.left + i * 90;
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", String(x));
        rect.setAttribute("y", String(legendY - 8));
        rect.setAttribute("width", "12");
        rect.setAttribute("height", "8");
        rect.setAttribute("fill", ds.color ?? resolveColor(i));
        svg.appendChild(rect);
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", String(x + 16));
        text.setAttribute("y", String(legendY));
        text.setAttribute("font-size", "10");
        text.textContent = ds.label;
        svg.appendChild(text);
      });
    }

    // Tooltip element
    const tooltip = document.createElement("div");
    tooltip.className = "mini-chart-tooltip";
    tooltip.style.position = "absolute";
    tooltip.style.display = "none";
    tooltip.style.background = "rgba(0,0,0,0.8)";
    tooltip.style.color = "#fff";
    tooltip.style.padding = "4px 8px";
    tooltip.style.borderRadius = "4px";
    tooltip.style.fontSize = "12px";
    tooltip.style.pointerEvents = "none";
    container.appendChild(tooltip);

    // Add hover handlers to bars for tooltip
    const bars = svg.querySelectorAll("rect");
    bars.forEach((bar, i) => {
      bar.addEventListener("mouseenter", (e) => {
        const val = (e.target as SVGRectElement).getAttribute("data-value");
        if (val) {
          tooltip.textContent = val;
          tooltip.style.display = "block";
        }
      });
      bar.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
      });
    });

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