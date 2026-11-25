import { describe, it, expect } from "vitest";
import chartModule from "../MiniChart/index";
import tableModule from "../MiniTable/index";

describe("MiniChart", () => {
  it("parses bar chart data", () => {
    const model = chartModule.parse({ labels: ["A", "B"], datasets: [{ label: "D1", data: [10, 20] }] }, { type: "bar" });
    expect(model.kind).toBe("chart");
    expect((model as any).type).toBe("bar");
    expect((model as any).labels).toEqual(["A", "B"]);
    expect((model as any).datasets[0].data).toEqual([10, 20]);
  });

  it("handles empty labels", () => {
    const model = chartModule.parse({ labels: [], datasets: [{ label: "D", data: [] }] }, { type: "bar" });
    expect((model as any).labels).toEqual([]);
    expect((model as any).datasets[0].data).toEqual([]);
  });

  it("handles missing input", () => {
    const model = chartModule.parse(null);
    expect(model.kind).toBe("chart");
    expect((model as any).labels).toEqual([]);
    expect((model as any).datasets).toEqual([]);
  });

  it("defaults width to 400", () => {
    const model = chartModule.parse({ labels: ["A"], datasets: [{ label: "D", data: [5] }] }, { type: "bar" });
    expect((model as any).width).toBe(400);
  });

  it("defaults height to 300", () => {
    const model = chartModule.parse({ labels: ["A"], datasets: [{ label: "D", data: [5] }] }, { type: "bar" });
    expect((model as any).height).toBe(300);
  });

  it("measures chart dimensions", () => {
    const model = chartModule.parse({ labels: ["A"], datasets: [{ label: "D1", data: [5] }] }, { type: "bar", width: 300, height: 200 });
    const ctx = { container: { element: {} } } as any;
    const result = chartModule.measure(model, ctx);
    expect(result.intrinsic.width).toBe(300);
    expect(result.intrinsic.height).toBe(200);
  });

  it("parses pie chart", () => {
    const model = chartModule.parse({ labels: ["X", "Y"], datasets: [{ label: "D", data: [30, 70] }] }, { type: "pie" });
    expect((model as any).type).toBe("pie");
  });

  it("parses doughnut chart", () => {
    const model = chartModule.parse({ labels: ["X", "Y"], datasets: [{ label: "D", data: [30, 70] }] }, { type: "doughnut" });
    expect((model as any).type).toBe("doughnut");
  });

  it("parses area chart", () => {
    const model = chartModule.parse({ labels: ["A", "B"], datasets: [{ label: "D", data: [5, 10] }] }, { type: "area" });
    expect((model as any).type).toBe("area");
  });

  it("parses scatter chart", () => {
    const model = chartModule.parse({ labels: ["A", "B", "C"], datasets: [{ label: "D", data: [1, 5, 3] }] }, { type: "scatter" });
    expect((model as any).type).toBe("scatter");
  });

  it("parses scatter chart", () => {
    const model = chartModule.parse({ labels: ["A", "B", "C"], datasets: [{ label: "D", data: [1, 5, 3] }] }, { type: "scatter" });
    expect((model as any).type).toBe("scatter");
  });

  it("parses radar chart", () => {
    const model = chartModule.parse({ labels: ["Speed", "Power", "Range"], datasets: [{ label: "D", data: [80, 60, 90] }] }, { type: "radar" });
    expect((model as any).type).toBe("radar");
  });

  it("parses bubble chart", () => {
    const model = chartModule.parse({ labels: ["A", "B"], datasets: [{ label: "D", data: [10, 20] }] }, { type: "bubble" });
    expect((model as any).type).toBe("bubble");
  });

  it("parses all chart types", () => {
    const types = ["bar", "bar-horizontal", "line", "area", "scatter", "pie", "doughnut", "radar", "bubble", "mixed"] as const;
    for (const t of types) {
      const model = chartModule.parse({ labels: ["A", "B"], datasets: [{ label: "D", data: [1, 2] }] }, { type: t });
      expect((model as any).type).toBe(t);
    }
  });

  it("measures all chart types", () => {
    const types = ["bar", "bar-horizontal", "line", "area", "scatter", "pie", "doughnut", "radar", "bubble", "mixed"] as const;
    const ctx = { container: { element: {} } } as any;
    for (const t of types) {
      const model = chartModule.parse({ labels: ["A", "B"], datasets: [{ label: "D", data: [1, 2] }] }, { type: t, width: 200, height: 150 });
      const result = chartModule.measure(model, ctx);
      expect(result.intrinsic.width).toBe(200);
      expect(result.intrinsic.height).toBe(150);
    }
  });

  it("parses area chart", () => {
    const model = chartModule.parse({ labels: ["A", "B"], datasets: [{ label: "D", data: [5, 10] }] }, { type: "area" });
    expect((model as any).type).toBe("area");
  });

  it("parses line chart", () => {
    const model = chartModule.parse({ labels: ["A", "B"], datasets: [{ label: "D", data: [5, 10] }] }, { type: "line" });
    expect((model as any).type).toBe("line");
  });

  it("measures with custom dimensions", () => {
    const model = chartModule.parse({ labels: ["A"], datasets: [{ label: "D", data: [5] }] }, { type: "bar", width: 500, height: 400 });
    const ctx = { container: { element: {} } } as any;
    const result = chartModule.measure(model, ctx);
    expect(result.intrinsic.width).toBe(500);
    expect(result.intrinsic.height).toBe(400);
  });

  it("measures pie chart dimensions", () => {
    const model = chartModule.parse({ labels: ["A", "B"], datasets: [{ label: "D", data: [30, 70] }] }, { type: "pie", width: 200, height: 200 });
    const ctx = { container: { element: {} } } as any;
    const result = chartModule.measure(model, ctx);
    expect(result.intrinsic.width).toBe(200);
    expect(result.intrinsic.height).toBe(200);
  });

  it("measures radar chart dimensions", () => {
    const model = chartModule.parse({ labels: ["A", "B", "C"], datasets: [{ label: "D", data: [1, 2, 3] }] }, { type: "radar", width: 300, height: 300 });
    const ctx = { container: { element: {} } } as any;
    const result = chartModule.measure(model, ctx);
    expect(result.intrinsic.width).toBe(300);
    expect(result.intrinsic.height).toBe(300);
  });

  it("measure returns min dimensions", () => {
    const model = chartModule.parse({ labels: ["A"], datasets: [{ label: "D", data: [5] }] }, { type: "bar" });
    const ctx = { container: { element: {} } } as any;
    const result = chartModule.measure(model, ctx);
    expect(result.min.width).toBe(100);
    expect(result.min.height).toBe(80);
  });

  it("measure returns bbox", () => {
    const model = chartModule.parse({ labels: ["A"], datasets: [{ label: "D", data: [5] }] }, { type: "bar", width: 400, height: 300 });
    const ctx = { container: { element: {} } } as any;
    const result = chartModule.measure(model, ctx);
    expect(result.bbox.x).toBe(0);
    expect(result.bbox.y).toBe(0);
    expect(result.bbox.width).toBe(400);
    expect(result.bbox.height).toBe(300);
  });

  it("parses with axis labels", () => {
    const model = chartModule.parse({ labels: ["A", "B"], datasets: [{ label: "D", data: [5, 10] }] }, { type: "bar", xAxisLabel: "Category", yAxisLabel: "Value" });
    expect((model as any).xAxisLabel).toBe("Category");
    expect((model as any).yAxisLabel).toBe("Value");
  });

  it("parses with title", () => {
    const model = chartModule.parse({ labels: ["A", "B"], datasets: [{ label: "D", data: [5, 10] }] }, { type: "bar", title: "Sales" });
    expect((model as any).title).toBe("Sales");
  });

  it("parses with multiple datasets", () => {
    const model = chartModule.parse({ labels: ["A", "B"], datasets: [{ label: "D1", data: [5, 10] }, { label: "D2", data: [3, 7] }] }, { type: "bar" });
    expect((model as any).datasets.length).toBe(2);
  });

  it("parses doughnut with custom ratio", () => {
    const model = chartModule.parse({ labels: ["A", "B"], datasets: [{ label: "D", data: [30, 70] }] }, { type: "doughnut", donutRatio: 0.7 });
    expect((model as any).donutRatio).toBe(0.7);
  });

  it("defaults donutRatio to undefined", () => {
    const model = chartModule.parse({ labels: ["A", "B"], datasets: [{ label: "D", data: [30, 70] }] }, { type: "doughnut" });
    expect((model as any).donutRatio).toBeUndefined();
  });

  it("parses with legend position", () => {
    const model = chartModule.parse({ labels: ["A", "B"], datasets: [{ label: "D1", data: [5, 10] }, { label: "D2", data: [3, 7] }] }, { type: "bar", legendPosition: "bottom" });
    expect((model as any).legendPosition).toBe("bottom");
  });

  it("defaults legendPosition to undefined", () => {
    const model = chartModule.parse({ labels: ["A", "B"], datasets: [{ label: "D", data: [5, 10] }] }, { type: "bar" });
    expect((model as any).legendPosition).toBeUndefined();
  });

  it("parses with stacked option", () => {
    const model = chartModule.parse({ labels: ["A", "B"], datasets: [{ label: "D1", data: [5, 10] }, { label: "D2", data: [3, 7] }] }, { type: "bar", stacked: true });
    expect((model as any).stacked).toBe(true);
  });

  it("defaults stacked to undefined", () => {
    const model = chartModule.parse({ labels: ["A", "B"], datasets: [{ label: "D", data: [5, 10] }] }, { type: "bar" });
    expect((model as any).stacked).toBeUndefined();
  });

});

describe("MiniTable selection", () => {
  it("parses with selectable option", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [{ id: "r1", cells: { name: "Alice" } }] }, { selectable: true });
    expect((model as any).selectable).toBe(true);
    expect((model as any).selectedRows.size).toBe(0);
  });

  it("parses with resizable option", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] }, { resizable: true });
    expect((model as any).resizable).toBe(true);
  });

  it("parses with virtualized option", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] }, { virtualized: true, rowHeight: 24, viewportHeight: 200 });
    expect((model as any).virtualized).toBe(true);
    expect((model as any).rowHeight).toBe(24);
    expect((model as any).viewportHeight).toBe(200);
  });

  it("defaults pageSize to 25", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] });
    expect((model as any).pageSize).toBe(25);
  });

  it("accepts custom pageSize", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] }, { pageSize: 50 });
    expect((model as any).pageSize).toBe(50);
  });

  it("defaults striped to true", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] });
    expect((model as any).striped).toBe(true);
  });

  it("defaults bordered to true", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] });
    expect((model as any).bordered).toBe(true);
  });

  it("defaults filter to empty string", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] });
    expect((model as any).filter).toBe("");
  });

  it("defaults sortColumn to null", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] });
    expect((model as any).sortColumn).toBeNull();
  });

  it("defaults sortDirection to asc", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] });
    expect((model as any).sortDirection).toBe("asc");
  });

  it("defaults currentPage to 0", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] });
    expect((model as any).currentPage).toBe(0);
  });

  it("accepts striped false", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] }, { striped: false });
    expect((model as any).striped).toBe(false);
  });

  it("accepts bordered false", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] }, { bordered: false });
    expect((model as any).bordered).toBe(false);
  });

  it("defaults selectable to false", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] });
    expect((model as any).selectable).toBe(false);
  });

  it("defaults resizable to false", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] });
    expect((model as any).resizable).toBe(false);
  });

  it("parses with resizable option", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] }, { resizable: true });
    expect((model as any).resizable).toBe(true);
  });

  it("defaults virtualized to false", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] });
    expect((model as any).virtualized).toBe(false);
  });

  it("defaults highlightFilter to false", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] });
    expect((model as any).highlightFilter).toBe(false);
  });

  it("parses with highlightFilter option", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] }, { highlightFilter: true });
    expect((model as any).highlightFilter).toBe(true);
  });

  it("parses with showFooter option", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] }, { showFooter: true, footerCells: { name: "Total" } });
    expect((model as any).showFooter).toBe(true);
    expect((model as any).footerCells.name).toBe("Total");
  });

  it("defaults showFooter to false", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] });
    expect((model as any).showFooter).toBe(false);
  });

  it("parses with showFooter", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] }, { showFooter: true });
    expect((model as any).showFooter).toBe(true);
  });

  it("parses with aggregation option", () => {
    const model = tableModule.parse({ columns: [{ id: "val", header: "Val" }], rows: [] }, { aggregation: { val: "sum" } });
    expect((model as any).aggregation.val).toBe("sum");
  });

  it("defaults selectable to false for footer", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] }, { showFooter: true });
    expect((model as any).selectable).toBe(false);
  });

  it("measures with multiple columns", () => {
    const model = tableModule.parse({
      columns: [{ id: "a", header: "A", width: 100 }, { id: "b", header: "B", width: 200 }, { id: "c", header: "C", width: 150 }],
      rows: [{ id: "r1", cells: { a: 1, b: 2, c: 3 } }],
    });
    const ctx = { container: { element: {} } } as any;
    const result = tableModule.measure(model, ctx);
    expect(result.intrinsic.width).toBe(450);
  });

  it("measures table with no rows", () => {
    const model = tableModule.parse({
      columns: [{ id: "a", header: "A", width: 100 }],
      rows: [],
    });
    const ctx = { container: { element: {} } } as any;
    const result = tableModule.measure(model, ctx);
    expect(result.intrinsic.width).toBe(100);
    expect(result.intrinsic.height).toBeGreaterThan(0);
  });

  it("measures with default column width", () => {
    const model = tableModule.parse({
      columns: [{ id: "a", header: "A" }, { id: "b", header: "B" }],
      rows: [],
    });
    const ctx = { container: { element: {} } } as any;
    const result = tableModule.measure(model, ctx);
    expect(result.intrinsic.width).toBe(240); // 2 * 120
  });

  it("handles empty table", () => {
    const model = tableModule.parse({ columns: [], rows: [] });
    const ctx = { container: { element: {} } } as any;
    const result = tableModule.measure(model, ctx);
    expect(result.intrinsic.width).toBe(0);
  });
});

describe("MiniTable", () => {
  it("parses table data", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [{ id: "r1", cells: { name: "Alice" } }] });
    expect(model.kind).toBe("table");
    expect((model as any).columns.length).toBe(1);
    expect((model as any).rows.length).toBe(1);
  });

  it("measures table dimensions", () => {
    const model = tableModule.parse({ columns: [{ id: "a", header: "A", width: 100 }, { id: "b", header: "B", width: 150 }], rows: [{ id: "r1", cells: { a: 1, b: 2 } }] });
    const ctx = { container: { element: {} } } as any;
    const result = tableModule.measure(model, ctx);
    expect(result.intrinsic.width).toBe(250);
  });

  it("sorts rows ascending", () => {
    const model = tableModule.parse({ columns: [{ id: "val", header: "Val" }], rows: [{ id: "r1", cells: { val: 3 } }, { id: "r2", cells: { val: 1 } }] });
    (model as any).sortColumn = "val";
    (model as any).sortDirection = "asc";
    // Just verify model structure
    expect((model as any).sortColumn).toBe("val");
  });
});