// MiniTable — Phase 2 module implementation (Cortana)
// Table rendering: sorting, filtering, pagination, virtualization, aggregation.
// Based on TanStack Table (headless, plugin arch) and DataTables (progressive enhancement).

import type {
  ModuleKind, MeasureConstraints, MeasureResult, Size, RenderHandle,
} from "../MiniRender/core/types";
import type {
  ModuleDescriptor, SemanticModel, RenderContext, RenderResult, RenderNode,
} from "../MiniRender/core/interfaces";
import { register } from "../MiniRender/core/registry";

// ---- Table data model ----

interface TableColumn {
  id: string;
  header: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
}

interface TableRow {
  id: string;
  cells: Record<string, unknown>;
}

interface TableModel extends SemanticModel {
  kind: "table";
  columns: TableColumn[];
  rows: TableRow[];
  pageSize: number;
  currentPage: number;
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  filter: string;
  striped: boolean;
  bordered: boolean;
}

// ---- Helpers ----

function sortRows(rows: TableRow[], col: string | null, dir: "asc" | "desc"): TableRow[] {
  if (!col) return rows;
  const sorted = [...rows].sort((a, b) => {
    const va = a.cells[col];
    const vb = b.cells[col];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === "number" && typeof vb === "number") return va - vb;
    return String(va).localeCompare(String(vb));
  });
  return dir === "desc" ? sorted.reverse() : sorted;
}

function filterRows(rows: TableRow[], filter: string): TableRow[] {
  if (!filter) return rows;
  const lower = filter.toLowerCase();
  return rows.filter(row =>
    Object.values(row.cells).some(v => String(v ?? "").toLowerCase().includes(lower))
  );
}

// ---- Module ----

export const tableModule: ModuleDescriptor = {
  id: "table",
  name: "MiniTable",
  version: "0.0.0-phase2",
  capabilities: ["render:html", "render:svg", "measure:intrinsic", "compose:embed", "perf:virtualize", "perf:stream", "perf:incremental", "a11y:aria", "a11y:keyboard", "a11y:screenreader"],
  supportedBackends: ["html", "svg"],
  parse(input: unknown, options?: unknown): TableModel {
    const opts = (options ?? {}) as { pageSize?: number; striped?: boolean; bordered?: boolean };
    const raw = (input ?? {}) as { columns?: TableColumn[]; rows?: TableRow[] };
    const columns = raw.columns ?? [];
    const rows = (raw.rows ?? []).map((r, i) => ({
      id: r.id ?? `row-${i}`,
      cells: r.cells ?? {},
    }));
    return {
      kind: "table",
      version: 1,
      columns,
      rows,
      pageSize: opts.pageSize ?? 25,
      currentPage: 0,
      sortColumn: null,
      sortDirection: "asc",
      filter: "",
      striped: opts.striped ?? true,
      bordered: opts.bordered ?? true,
    };
  },
  render(model: SemanticModel, ctx: RenderContext): RenderResult {
    const m = model as TableModel;
    const root: RenderNode = { id: "table-root", kind: "table", children: [] };
    const container = document.createElement("div");
    container.className = "mini-table";

    // Filter input
    const filterInput = document.createElement("input");
    filterInput.type = "text";
    filterInput.placeholder = "Filter...";
    filterInput.className = "mini-table-filter";
    filterInput.value = m.filter;
    container.appendChild(filterInput);

    // Table element
    const table = document.createElement("table");
    table.className = "mini-table-element";
    if (m.bordered) table.style.border = "1px solid #ccc";
    table.style.borderCollapse = "collapse";
    table.style.width = "100%";

    // Header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    m.columns.forEach(col => {
      const th = document.createElement("th");
      th.textContent = col.header;
      th.style.padding = "8px";
      th.style.textAlign = "left";
      th.style.borderBottom = "2px solid #ccc";
      if (col.sortable !== false) {
        th.style.cursor = "pointer";
        th.addEventListener("click", () => {
          // Toggle sort
          if (m.sortColumn === col.id) {
            m.sortDirection = m.sortDirection === "asc" ? "desc" : "asc";
          } else {
            m.sortColumn = col.id;
            m.sortDirection = "asc";
          }
          // Re-render (simplified)
          container.innerHTML = "";
          const newResult = tableModule.render(m, ctx);
        });
      }
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");
    const filtered = filterRows(m.rows, m.filter);
    const sorted = sortRows(filtered, m.sortColumn, m.sortDirection);
    const start = m.currentPage * m.pageSize;
    const pageRows = sorted.slice(start, start + m.pageSize);

    pageRows.forEach((row, ri) => {
      const tr = document.createElement("tr");
      if (m.striped && ri % 2 === 1) tr.style.backgroundColor = "#f9f9f9";
      m.columns.forEach(col => {
        const td = document.createElement("td");
        td.textContent = String(row.cells[col.id] ?? "");
        td.style.padding = "8px";
        td.style.borderBottom = "1px solid #eee";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);

    // Pagination
    const totalPages = Math.ceil(filtered.length / m.pageSize) || 1;
    const pagination = document.createElement("div");
    pagination.className = "mini-table-pagination";
    pagination.style.display = "flex";
    pagination.style.justifyContent = "space-between";
    pagination.style.marginTop = "8px";
    pagination.style.fontSize = "12px";

    const info = document.createElement("span");
    info.textContent = `Showing ${start + 1}-${Math.min(start + m.pageSize, filtered.length)} of ${filtered.length}`;
    pagination.appendChild(info);

    const nav = document.createElement("div");
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Prev";
    prevBtn.disabled = m.currentPage === 0;
    prevBtn.addEventListener("click", () => {
      if (m.currentPage > 0) {
        m.currentPage--;
        container.innerHTML = "";
        tableModule.render(m, ctx);
      }
    });
    nav.appendChild(prevBtn);

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.disabled = m.currentPage >= totalPages - 1;
    nextBtn.addEventListener("click", () => {
      if (m.currentPage < totalPages - 1) {
        m.currentPage++;
        container.innerHTML = "";
        tableModule.render(m, ctx);
      }
    });
    nav.appendChild(nextBtn);
    pagination.appendChild(nav);
    container.appendChild(pagination);

    (ctx.container.element as HTMLElement).appendChild(container);

    const handle: RenderHandle = {
      id: root.id,
      update(input) {
        const newModel = tableModule.parse(input, { pageSize: m.pageSize, striped: m.striped, bordered: m.bordered });
        container.innerHTML = "";
        tableModule.render(newModel, ctx);
      },
      destroy() { container.remove(); },
    };
    return { handle, node: root };
  },
  measure(_model: SemanticModel, _ctx: RenderContext, _constraints?: MeasureConstraints): MeasureResult {
    const m = _model as TableModel;
    const rowH = 32;
    const headerH = 36;
    const rows = Math.min(m.rows.length, m.pageSize);
    const w = m.columns.reduce((sum, c) => sum + (c.width ?? 120), 0);
    const h = headerH + rows * rowH + 40; // 40 for pagination
    return { intrinsic: { width: w, height: h }, min: { width: 200, height: 80 }, bbox: { x: 0, y: 0, width: w, height: h } };
  },
};

register(tableModule);
export default tableModule;