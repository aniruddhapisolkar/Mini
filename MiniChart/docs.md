# MiniChart Documentation

## Overview

MiniChart is a lightweight chart rendering module for the Mini rendering library. It supports 10 chart types with SVG-based rendering, grid lines, axis labels, legends, and tooltips.

## Chart Types

- **bar** — vertical bar chart
- **bar-horizontal** — horizontal bar chart
- **line** — line chart with connected points
- **area** — area chart (filled under line)
- **scatter** — scatter plot
- **pie** — pie chart
- **doughnut** — doughnut chart
- **radar** — radar/spider chart
- **bubble** — bubble chart
- **mixed** — mixed chart types

## Basic Usage

```typescript
import chartModule from "mini/chart";

const model = chartModule.parse(
  { labels: ["A", "B", "C"], datasets: [{ label: "Sales", data: [10, 20, 15] }] },
  { type: "bar", width: 400, height: 300, title: "Sales Chart" }
);

const ctx = { container: { element: document.getElementById("chart") } };
const result = chartModule.render(model, ctx);
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| type | string | "bar" | Chart type |
| width | number | 400 | Chart width |
| height | number | 300 | Chart height |
| title | string | undefined | Chart title |
| xAxisLabel | string | undefined | X-axis label |
| yAxisLabel | string | undefined | Y-axis label |
| donutRatio | number | 0.5 | Doughnut hole ratio |
| legendPosition | string | "bottom" | Legend position (top/bottom/left/right) |
| stacked | boolean | false | Stack bars |

## Features

- SVG-based rendering
- Grid lines and Y-axis tick labels
- Axis labels (X and Y)
- Legend for multi-dataset charts
- Tooltip on bar hover
- Pie chart labels
- Dark mode via CSS variables

## Dark Mode

MiniChart supports dark mode via CSS variables:

```css
:root {
  --mini-bg: #fff;
  --mini-text: #333;
  --mini-grid: #eee;
}
```

## Backends

- HTML (DOM-based)
- SVG (namespace-based)
- Canvas (planned)