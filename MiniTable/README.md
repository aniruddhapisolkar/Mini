# MiniTable

Lightweight table rendering module for the Mini rendering library.

## Features

- Sorting (click column header to toggle asc/desc)
- Filtering (text search across all cells)
- Pagination (configurable page size with prev/next navigation)
- Virtualized rendering for large datasets (viewport-based row rendering)
- Row selection (checkboxes with select-all)
- Column resizing (drag handle on header)
- Striped and bordered styling options

## Usage

```typescript
import tableModule from "mini/table";

const model = tableModule.parse(
  {
    columns: [
      { id: "name", header: "Name", width: 150 },
      { id: "age", header: "Age", width: 80 },
    ],
    rows: [
      { id: "r1", cells: { name: "Alice", age: 30 } },
      { id: "r2", cells: { name: "Bob", age: 25 } },
    ],
  },
  { pageSize: 10, striped: true, bordered: true, selectable: true, resizable: true }
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

## Backends

- HTML (DOM-based)
- SVG (planned)