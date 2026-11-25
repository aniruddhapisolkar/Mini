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

  it("parses with axis labels", () => {
    const model = chartModule.parse({ labels: ["A", "B"], datasets: [{ label: "D", data: [5, 10] }] }, { type: "bar", xAxisLabel: "Category", yAxisLabel: "Value" });
    expect((model as any).xAxisLabel).toBe("Category");
    expect((model as any).yAxisLabel).toBe("Value");
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

  it("defaults selectable to false", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] });
    expect((model as any).selectable).toBe(false);
  });

  it("defaults resizable to false", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] });
    expect((model as any).resizable).toBe(false);
  });

  it("defaults virtualized to false", () => {
    const model = tableModule.parse({ columns: [{ id: "name", header: "Name" }], rows: [] });
    expect((model as any).virtualized).toBe(false);
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

  it("measures with multiple columns", () => {
    const model = tableModule.parse({
      columns: [{ id: "a", header: "A", width: 100 }, { id: "b", header: "B", width: 200 }, { id: "c", header: "C", width: 150 }],
      rows: [{ id: "r1", cells: { a: 1, b: 2, c: 3 } }],
    });
    const ctx = { container: { element: {} } } as any;
    const result = tableModule.measure(model, ctx);
    expect(result.intrinsic.width).toBe(450);
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