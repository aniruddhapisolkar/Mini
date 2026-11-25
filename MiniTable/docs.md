# MiniTable Documentation

## Overview

MiniTable is a lightweight, zero-dependency table rendering module for the Mini rendering library. It supports sorting, filtering, pagination, virtualization, row selection, and column resizing.

## Basic Usage

```typescript
import tableModule from "mini/table";

const model = tableModule.parse(
  {
    columns: [
      { id: "name", header: "Name", width: 150, sortable: true },
      { id: "age", header: "Age", width: 80, sortable: true },
    ],
    rows: [
      { id: "r1", cells: { name: "Alice", age: 30 } },
      { id: "r2", cells: { name: "Bob", age: 25 } },
    ],
  },
  { pageSize: 10, striped: true, bordered: true }
);

const ctx = { container: { element: document.getElementById("table") } };
const result = tableModule.render(model, ctx);
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| pageSize | number | 25 | Rows per page |
| striped | boolean | true | Alternate row colors |
| bordered | boolean | true | Show borders |
| selectable | boolean | false | Enable row selection |
| resizable | boolean | false | Enable column resizing |
| virtualized | boolean | false | Enable virtual scrolling |
| rowHeight | number | 32 | Row height (virtualized) |
| viewportHeight | number | 400 | Viewport height (virtualized) |
| showFooter | boolean | false | Show footer row |
| footerCells | object | {} | Footer cell content |
| aggregation | object | {} | Column aggregation (sum/avg/count/min/max) |
| highlightFilter | boolean | false | Highlight filter matches |

## Sorting

Click on a column header to sort. Click again to toggle direction.

## Filtering

Set the `filter` property on the model to filter rows by text.

## Pagination

Use `currentPage` to navigate pages. Prev/Next buttons are rendered automatically.

## Virtualization

For large datasets, enable `virtualized: true` to only render visible rows.

## Row Selection

Enable `selectable: true` to add checkboxes for row selection. Use `selectedRows` (a Set) to track selected row IDs.

## Column Resizing

Enable `resizable: true` to add drag handles on column headers.

## Aggregation

Set `aggregation` to compute column totals in the footer:

```typescript
{ aggregation: { age: "avg", salary: "sum" } }
```

## Dark Mode

MiniTable supports dark mode via CSS variables:

```css
:root {
  --mini-bg: #fff;
  --mini-text: #333;
  --mini-border: #ccc;
}
```