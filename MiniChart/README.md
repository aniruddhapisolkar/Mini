# MiniChart

Lightweight chart rendering module for the Mini rendering library.

## Chart Types

- **bar** — vertical bar chart
- **line** — line chart with connected points
- **area** — area chart (filled under line)
- **scatter** — scatter plot
- **pie** — pie chart
- **doughnut** — doughnut chart
- **radar** — radar/spider chart
- **bubble** — bubble chart
- **mixed** — mixed chart types

## Usage

```typescript
import chartModule from "mini/chart";

const model = chartModule.parse(
  { labels: ["A", "B", "C"], datasets: [{ label: "Sales", data: [10, 20, 15] }] },
  { type: "bar", width: 400, height: 300, title: "Sales Chart" }
);

const ctx = { container: { element: document.getElementById("chart") } };
const result = chartModule.render(model, ctx);

// Measure
const size = chartModule.measure(model, ctx);
console.log(size.intrinsic); // { width: 400, height: 300 }
```

## Features

- SVG-based rendering (no Canvas dependency for basic charts)
- Grid lines and axis tick labels
- Legend for multi-dataset charts
- Tooltip on bar hover
- Dark mode compatible via CSS variables
- Zero external runtime dependencies

## Backends

- HTML (DOM-based)
- SVG (namespace-based)
- Canvas (planned)