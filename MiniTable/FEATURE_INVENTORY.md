# MiniTable — Feature Inventory

Owner: Cortana
References: TanStack Table (v9), DataTables (v2.3)
Status: Phase 0 research

## 1. Reference libraries pinned

- TanStack Table: https://github.com/TanStack/table — v9 (latest)
  - Headless, framework-agnostic, plugin/feature architecture, tree-shakeable.
- DataTables: https://datatables.net — v2.3 (latest)
  - jQuery-based, extensive API, extensions ecosystem, server-side processing.

## 2. Core table capabilities

- Static tables (simple HTML/Markdown tables)
- Interactive data grids
- Sorting (single/multi column, custom sort fns)
- Filtering (column-level, global, fuzzy)
- Searching
- Pagination (client & server-side)
- Row virtualization (large datasets)
- Column virtualization
- Column resizing
- Column reordering
- Column pinning (left/right freeze)
- Column visibility (show/hide)
- Column grouping (header groups)
- Grouping rows (group by column)
- Aggregation (sum, avg, count, custom)
- Hierarchical rows / tree data
- Expandable rows (sub-rows)
- Row & cell selection (single/multi, ranges)
- Editable cells
- Custom cell renderers
- Large datasets (10k+ rows)
- Streaming data
- Reactive updates
- Responsive layouts (collapse columns, card view)
- Data import/export (CSV, JSON, Excel)
- Keyboard navigation
- Embedded content from other Mini modules (charts, math, code)

## 3. TanStack v9 feature model (adopt)

Feature-based plugin architecture: table declares only features it uses.
Stock features:
- cellSelectionFeature, cellSpanningFeature
- columnFacetingFeature, columnFilteringFeature, columnGroupingFeature
- columnOrderingFeature, columnPinningFeature, columnResizingFeature
- columnSizingFeature, columnVisibilityFeature
- globalFilteringFeature
- rowAggregationFeature, rowExpandingFeature, rowPaginationFeature
- rowPinningFeature, rowSelectionFeature, rowSortingFeature

Row models: core (auto), sorted, filtered, paginated, grouped, expanded, etc.
Manual/server-side: keep feature for state/API, omit client row model, set manual*.

## 4. DataTables capabilities (parity targets)
- Ajax data loading
- Server-side processing (pagination/filter/sort on server)
- Search (smart, regex, function)
- Ordering (multi-col, fixed)
- Paging (numbers, simple, full, etc.)
- Scrolling (vertical/horizontal virtualization)
- Column control (visibility, reordering)
- Extensions: Buttons (export), FixedColumns, FixedHeader, KeyTable, Responsive, RowGroup, RowReorder, Scroller, SearchBuilder, SearchPanes, Select, StateRestore
- Events, i18n, theming via CSS frameworks
- Layout system (slots for features)

## 5. Architecture decisions for MiniTable
- Headless core (logic) + optional default renderer (HTML table)
- Backend-agnostic: DOM table by default; virtualized rendering for large data
- Feature registration (tree-shakeable, like TanStack)
- Column definitions: accessor (key/fn), header (string/component), cell renderer
- State management: controlled/uncontrolled, reactive updates
- Row virtualization via shared virtualization util (also used by MiniChart)
- Streaming: append rows, reactive re-render

## 6. Performance
- Virtualization for 10k+ rows
- Memoized row models
- Incremental updates (only changed rows)
- Lazy column rendering
- Minimal DOM for simple static tables (no grid overhead)

## 7. Accessibility
- Semantic table markup (thead/tbody/th/td)
- ARIA roles for grid (role="grid", gridcell, rowheader)
- Keyboard navigation (arrow keys, enter, space)
- Screen reader announcements for sort/filter state
- Focus management

## 8. Cross-module composition
- Cells can embed charts, math, code, diagrams, text
- Header/footer can contain rich content
- Export includes embedded content where possible

## 9. Public API (draft)
```ts
Mini.table.render(data, container, options?);
Mini.table.create(container, { columns, data, features });
instance.sort(col, dir);
instance.filter(col, value);
instance.page(n);
instance.destroy();
```
Markdown tables auto-rendered by MiniText via MiniTable.

## 10. Build / distribution
- Zero runtime deps
- ESM + CJS + UMD
- Standalone bundle
- TypeScript declarations
- Minimal static-table path (no interactive overhead)
