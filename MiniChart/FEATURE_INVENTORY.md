# MiniChart — Feature Inventory

Owner: Cortana
References: Chart.js (v4.6.1), Recharts (v3.10.1), plus scientific/interactive visualization libraries
Status: Phase 0 research

## 1. Reference libraries pinned

- Chart.js: https://github.com/chartjs/chart.js — v4.6.1 (latest stable, 2026-10)
  - Canvas-based, 8 chart types built in, tree-shakeable, plugin ecosystem.
- Recharts: https://github.com/recharts/recharts — v3.10.1
  - React + D3 composable SVG charts, MIT license.
- Additional: D3 (math/scales), scientific viz libs.

## 2. Chart types (MiniChart must support)

From Chart.js + Recharts union:

### Cartesian
- Line chart (single/multi series, stepped, smoothed curves)
- Bar chart (vertical/horizontal, grouped, stacked, floating ranges)
- Area chart (stacked, 100% stacked, stepped, gradient fills)
- Scatter plot
- Bubble chart (x, y, r)
- Mixed/composed charts (blend line/bar/area/scatter on shared axes)
- Histogram (binning)
- Box plot (min, Q1, median, Q3, max, outliers)
- Heatmap (2D grid, color scale)
- Radar / spider chart
- Polar area / radial bar
- Pie chart
- Doughnut chart
- Funnel chart
- Sankey / flow diagram (data-driven)
- Treemap
- Candlestick / OHLC financial chart
- Time-series chart (date-time axis, zoom/pan)

### Scales / axes
- Linear, logarithmic, time, category, ordinal scales
- Multiple axes (x/y, left/right)
- Stacked scales
- Custom scales
- Axis ticks, labels, grid lines, reference lines/areas/dots
- Min/max, suggestedMin/Max, reverse, offset

## 3. Data model & parsing
- Array of objects; accessor by key or function
- Normalized data (unique, sorted, consistent indices) fast path
- Parsing disabled mode for pre-normalized data
- Decimation / sampling for large datasets
- Streaming / incremental data append

## 4. Rendering
- Backend selection: Canvas (perf, large datasets), SVG (crisp, CSS styling), WebGL (very large)
- Responsive sizing (container resize observer)
- Device pixel ratio handling
- Clipping to chart area
- Layered rendering: grid -> data -> labels -> overlays

## 5. Interaction
- Tooltips (custom content, positioning, follow cursor)
- Legend (toggle datasets, custom render)
- Hover/active states, highlight
- Zooming and panning (mouse wheel, drag, touch)
- Brush selection (range selection on axis)
- Click events on elements
- Keyboard navigation
- Crosshair / cursor

## 6. Animation
- Entrance animations per element
- Update transitions (data change)
- Custom easing functions
- Reduced-motion preference respect
- Animation begin/duration, per-property config
- Replay / manual trigger

## 7. Styling & theming
- Colors, borders, fonts, padding
- Scriptable options (per-data-point styling)
- Plugins (title, subtitle, legend, tooltip, decimation, filler, colors)
- Custom plugins (extension points)
- Themes / dark mode

## 8. Performance
- Tree-shaking (register only needed controllers/elements/scales/plugins)
- Large dataset ingestion (internal format, skip parsing)
- Decimation plugin
- Canvas vs SVG backend selection
- Virtualization for very large series
- Incremental updates (avoid full redraw)
- Memory management / disposal

## 9. Accessibility
- ARIA roles/labels
- Keyboard navigation
- Screen reader descriptions
- Reduced motion
- Accessible color palettes

## 10. Export & serialization
- toBase64Image / toBlob (PNG, JPEG)
- SVG export
- JSON spec serialization
- CSV data export

## 11. Cross-module composition
- Chart embedded in tables, text, diagrams
- Math in labels/axes
- Code in tooltips
- Responsive dashboards combining charts

## 12. Public API (draft)
```ts
Mini.chart.render(spec, container, options?);
Mini.chart.create(container, config); // instance
instance.update(data);
instance.destroy();
```
Declarative spec (JSON) + programmatic API.

## 13. Build / distribution
- Zero runtime deps (D3 submodules vendored selectively)
- ESM + CJS + UMD, tree-shakeable
- Standalone bundle embeddable in single HTML
- TypeScript declarations
