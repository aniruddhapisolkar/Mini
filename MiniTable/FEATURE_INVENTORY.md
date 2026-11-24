# MiniTable — Feature Inventory

## Reference Libraries
- **Primary**: TanStack Table v8 (MIT, https://tanstack.com/table) — Headless, plugin architecture, framework-agnostic
- **Secondary**: DataTables 2.x (MIT, https://datatables.net) — jQuery-based, progressive enhancement, extensive API
- **Additional**: Advanced data grid libraries

## Licensing
All reference libraries are MIT licensed. Attribution required in THIRD_PARTY_NOTICES.md.

## Core Table Features

### Table Structure
- [ ] Static tables (simple data display)
- [ ] Dynamic tables (data-driven)
- [ ] Column definitions (accessor, header, cell renderer)
- [ ] Row models (flat, grouped, hierarchical)
- [ ] Header groups (nested column headers)
- [ ] Footer rows (aggregations)
- [ ] Caption / title
- [ ] Responsive layouts

### Sorting
- [ ] Single-column sort
- [ ] Multi-column sort
- [ ] Custom sort functions
- [ ] Sort direction indicators
- [ ] Server-side sorting
- [ ] Default sort state

### Filtering
- [ ] Global text search
- [ ] Column-level filters
- [ ] Custom filter functions
- [ ] Faceted filtering (value lists)
- [ ] Fuzzy search
- [ ] Server-side filtering
- [ ] Filter UI components (headless)

### Pagination
- [ ] Client-side pagination
- [ ] Server-side pagination
- [ ] Page size selection
- [ ] Page navigation (prev/next/first/last)
- [ ] Jump to page
- [ ] Infinite scroll / virtual scroll

### Virtualization
- [ ] Row virtualization (large datasets)
- [ ] Column virtualization (wide tables)
- [ ] Dynamic row heights
- [ ] Overscan configuration
- [ ] Scroll position restoration

### Column Management
- [ ] Column resizing (drag)
- [ ] Column reordering (drag)
- [ ] Column pinning (left/right)
- [ ] Column visibility toggle
- [ ] Column grouping
- [ ] Auto-width calculation

### Row Management
- [ ] Row selection (single/multi)
- [ ] Row expansion (detail rows)
- [ ] Hierarchical rows (tree data)
- [ ] Row grouping (with aggregations)
- [ ] Row pinning
- [ ] Row highlighting

### Cell Features
- [ ] Custom cell renderers
- [ ] Editable cells (inline editing)
- [ ] Cell spanning (colspan/rowspan)
- [ ] Cell selection
- [ ] Cell formatting
- [ ] Nested content (embedded modules)

### Aggregation
- [ ] Sum, average, min, max, count
- [ ] Custom aggregations
- [ ] Group-level aggregations
- [ ] Grand totals

### Data Processing
- [ ] Client-side data processing
- [ ] Server-side data processing
- [ ] Data import (CSV, JSON, TSV)
- [ ] Data export (CSV, JSON, Excel, PDF)
- [ ] Streaming data updates
- [ ] Reactive updates (observable data)
- [ ] Data validation

### Interaction
- [ ] Keyboard navigation (arrow keys, tab, enter)
- [ ] Focus management
- [ ] Context menus
- [ ] Drag and drop (rows/columns)
- [ ] Touch support
- [ ] Accessibility (screen reader, ARIA)

### Theming and Styling
- [ ] Headless (no default styles)
- [ ] Theme support (dark/light/custom)
- [ ] CSS class hooks
- [ ] Inline style support
- [ ] Responsive breakpoints

## Rendering and Backend
- [ ] HTML table backend (semantic <table>)
- [ ] Virtual DOM backend (for React/Vue/Svelte)
- [ ] Canvas backend (for massive datasets)
- [ ] Responsive layout engine
- [ ] Print-friendly output

## Extensibility
- [ ] Plugin system (feature plugins)
- [ ] Custom cell renderers
- [ ] Custom filter UI
- [ ] Custom sort functions
- [ ] Custom aggregation functions
- [ ] Event hooks (onRowClick, onCellEdit, etc.)
- [ ] Middleware support

## Cross-Module Composition
- [ ] Embedded MiniChart in cells
- [ ] Embedded MiniMath in cells
- [ ] Embedded MiniCode in cells
- [ ] Embedded MiniDiagram in cells
- [ ] Embedded MiniText in cells
- [ ] Sortable/filterable embedded content

## Performance Targets
- [ ] Render 10k rows < 100ms (virtualized)
- [ ] Sort 100k rows < 50ms
- [ ] Filter 100k rows < 50ms
- [ ] Scroll 60fps with 100k rows
- [ ] Memory: efficient row model
- [ ] Bundle: tree-shakeable, selective features

## Accessibility
- [ ] Semantic HTML table structure
- [ ] ARIA roles and attributes
- [ ] Keyboard navigation (full grid navigation)
- [ ] Screen reader support
- [ ] Focus indicators
- [ ] Reduced-motion support
