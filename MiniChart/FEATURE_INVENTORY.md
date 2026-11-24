# MiniChart — Feature Inventory

## Reference Libraries
- **Primary**: Chart.js (MIT, https://www.chartjs.org) — Canvas-based, plugin architecture, controller/scale/element pipeline
- **Secondary**: Recharts (MIT, https://recharts.github.io) — React/SVG-based, composable components, Redux state, D3 scales
- **Additional**: Scientific and interactive data visualization libraries

## Licensing
All reference libraries are MIT licensed. Attribution required in THIRD_PARTY_NOTICES.md.

## Chart Types

### Cartesian Charts
- [ ] Line charts (single/multi-series, smooth/stepped/linear)
- [ ] Bar charts (vertical/horizontal, grouped/stacked)
- [ ] Area charts (filled, stacked, ranged)
- [ ] Scatter plots
- [ ] Bubble charts
- [ ] Mixed/combo charts (bar + line overlays)
- [ ] Histograms
- [ ] Box plots / violin plots

### Polar / Radial Charts
- [ ] Pie charts
- [ ] Doughnut charts
- [ ] Radar / spider charts
- [ ] Radial bar charts
- [ ] Polar area charts

### Specialized Charts
- [ ] Heatmaps
- [ ] Financial charts (candlestick, OHLC)
- [ ] Time-series visualizations
- [ ] Statistical visualizations (box, violin, error bars)
- [ ] Funnel charts
- [ ] Sankey diagrams
- [ ] Treemaps
- [ ] Gauge / meter charts
- [ ] Custom chart types (plugin/extensible)

## Axes and Scales
- [ ] Category scale
- [ ] Linear scale
- [ ] Logarithmic scale
- [ ] Time scale
- [ ] Radial scale
- [ ] Multiple axes (X/Y/Z)
- [ ] Multiple scales per axis
- [ ] Custom scales
- [ ] Axis labels, titles, ticks
- [ ] Tick formatting
- [ ] Axis rotation (auto/manual)
- [ ] Axis grid lines
- [ ] Axis borders
- [ ] Stacked axes

## Data and Processing
- [ ] Raw array/object data input
- [ ] Data parsing (primitive, object, nested)
- [ ] Data key resolution (property, nested path, accessor function)
- [ ] Data aggregation (sum, avg, min, max, count)
- [ ] Stacking (sign, expand, wiggle offsets)
- [ ] Grouping
- [ ] Sorting
- [ ] Filtering
- [ ] Large datasets (10k+ points)
- [ ] Streaming / real-time data updates
- [ ] Incremental updates
- [ ] Server-side data processing
- [ ] Data decimation / downsampling

## Visual Elements
- [ ] Points / markers
- [ ] Lines (with tension, stepped, monotone)
- [ ] Bars (with radius, border, hover)
- [ ] Areas (filled, gradients)
- [ ] Arcs (pie/doughnut slices)
- [ ] Error bars
- [ ] Reference lines / areas / dots
- [ ] Annotations / labels
- [ ] Data labels (LabelList)
- [ ] Custom shapes (shape prop)

## Interaction
- [ ] Tooltips (hover, click, follow)
- [ ] Legends (position, toggle, custom content)
- [ ] Zooming and panning
- [ ] Brush selection
- [ ] Crosshair
- [ ] Active element highlighting
- [ ] Click / hover events
- [ ] Keyboard navigation
- [ ] Touch support

## Animation
- [ ] Initial animation
- [ ] Update animation (data change transitions)
- [ ] Mode-based transitions (active, hide, show, reset)
- [ ] Configurable duration/easing
- [ ] Reduced-motion preference support

## Rendering and Backend
- [ ] Canvas backend (primary for performance)
- [ ] SVG backend (for accessibility/composability)
- [ ] HTML backend (for tooltip/legend overlays)
- [ ] WebGL backend (for massive datasets)
- [ ] Responsive sizing
- [ ] Device pixel ratio handling
- [ ] Export: PNG, SVG, PDF, JSON

## Extensibility
- [ ] Plugin system (lifecycle hooks: beforeInit, afterDraw, etc.)
- [ ] Custom chart types (controller extension)
- [ ] Custom scales
- [ ] Custom elements
- [ ] Custom tooltip content
- [ ] Theme system
- [ ] Global defaults / per-chart overrides

## Accessibility
- [ ] Semantic HTML fallback
- [ ] ARIA labels and roles
- [ ] Screen reader support
- [ ] Keyboard navigation
- [ ] Reduced-motion support
- [ ] High-contrast mode

## Performance Targets
- [ ] Cold init < 50ms for simple chart
- [ ] Render 10k data points < 100ms (Canvas)
- [ ] Incremental update < 16ms (60fps)
- [ ] Memory: no leaks on destroy/update cycles
- [ ] Bundle: tree-shakeable, selective imports

## Cross-Module Composition
- [ ] Charts embeddable in MiniTable cells
- [ ] Charts embeddable in MiniText documents
- [ ] Math labels in chart axes (MiniMath)
- [ ] Diagram annotations (MiniDiagram)
- [ ] Code tooltips (MiniCode)
