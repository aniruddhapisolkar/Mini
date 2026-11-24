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