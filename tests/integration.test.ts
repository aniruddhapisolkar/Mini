import { describe, it, expect } from "vitest";
import { getModule, listModules, hasModule } from "../MiniRender/core/registry";

// Import all modules to register them
import "../MiniChart/index";
import "../MiniTable/index";
import "../MiniMath/index";
import "../MiniDiagram/index";
import "../MiniText/index";
import "../MiniCode/index";

describe("Cross-module integration", () => {
  it("all six modules are registered", () => {
    expect(hasModule("chart")).toBe(true);
    expect(hasModule("table")).toBe(true);
    expect(hasModule("math")).toBe(true);
    expect(hasModule("diagram")).toBe(true);
    expect(hasModule("text")).toBe(true);
    expect(hasModule("code")).toBe(true);
  });

  it("listModules returns all six", () => {
    const modules = listModules();
    expect(modules.length).toBeGreaterThanOrEqual(6);
    const ids = modules.map(m => m.id);
    expect(ids).toContain("chart");
    expect(ids).toContain("table");
    expect(ids).toContain("math");
    expect(ids).toContain("diagram");
    expect(ids).toContain("text");
    expect(ids).toContain("code");
  });

  it("each module has required contract methods", () => {
    const modules = ["chart", "table", "math", "diagram", "text", "code"];
    for (const id of modules) {
      const mod = getModule(id);
      expect(mod).toBeDefined();
      expect(typeof mod!.parse).toBe("function");
      expect(typeof mod!.render).toBe("function");
      expect(typeof mod!.measure).toBe("function");
      expect(Array.isArray(mod!.capabilities)).toBe(true);
      expect(Array.isArray(mod!.supportedBackends)).toBe(true);
    }
  });

  it("modules support html backend", () => {
    const modules = ["chart", "table", "math", "diagram", "text", "code"];
    for (const id of modules) {
      const mod = getModule(id);
      expect(mod!.supportedBackends).toContain("html");
    }
  });

  it("chart and table modules parse without errors", () => {
    const chart = getModule("chart")!;
    const table = getModule("table")!;
    const chartModel = chart.parse({ labels: ["A", "B"], datasets: [{ label: "D", data: [1, 2] }] });
    const tableModel = table.parse({ columns: [{ id: "x", header: "X" }], rows: [{ id: "r1", cells: { x: 1 } }] });
    expect(chartModel.kind).toBe("chart");
    expect(tableModel.kind).toBe("table");
  });

  it("math module parses latex", () => {
    const math = getModule("math")!;
    const model = math.parse("x^2 + y^2 = z^2");
    expect(model.kind).toBe("math");
  });

  it("code module parses source", () => {
    const code = getModule("code")!;
    const model = code.parse("const x = 1;", { language: "javascript" });
    expect(model.kind).toBe("code");
  });

  it("text module parses markdown", () => {
    const text = getModule("text")!;
    const model = text.parse("# Hello\n\nWorld");
    expect(model.kind).toBe("text");
  });

  it("diagram module parses flowchart", () => {
    const diagram = getModule("diagram")!;
    const model = diagram.parse("graph TD; A-->B;");
    expect(model.kind).toBe("diagram");
  });

  it("text module parses code blocks", () => {
    const text = getModule("text")!;
    const model = text.parse("```js\nconst x = 1;\n```");
    expect(model.kind).toBe("text");
  });

  it("code module parses python", () => {
    const code = getModule("code")!;
    const model = code.parse("def foo():\n    return 1", { language: "python" });
    expect(model.kind).toBe("code");
  });

  it("chart module parses doughnut", () => {
    const chart = getModule("chart")!;
    const model = chart.parse({ labels: ["A", "B"], datasets: [{ label: "D", data: [30, 70] }] }, { type: "doughnut" });
    expect((model as any).type).toBe("doughnut");
  });

  it("table module parses with options", () => {
    const table = getModule("table")!;
    const model = table.parse({ columns: [{ id: "x", header: "X" }], rows: [] }, { pageSize: 10, striped: false });
    expect((model as any).pageSize).toBe(10);
    expect((model as any).striped).toBe(false);
  });

  it("chart module supports all backends", () => {
    const chart = getModule("chart")!;
    expect(chart.supportedBackends).toContain("html");
    expect(chart.supportedBackends).toContain("svg");
    expect(chart.supportedBackends).toContain("canvas");
  });

  it("chart module has version", () => {
    const chart = getModule("chart")!;
    expect(chart.version).toBeDefined();
  });

  it("table module has version", () => {
    const table = getModule("table")!;
    expect(table.version).toBeDefined();
  });

  it("chart module has render and measure capabilities", () => {
    const chart = getModule("chart")!;
    expect(chart.capabilities).toContain("render:html");
    expect(chart.capabilities).toContain("render:svg");
    expect(chart.capabilities).toContain("measure:intrinsic");
  });

  it("table module has virtualization capability", () => {
    const table = getModule("table")!;
    expect(table.capabilities).toContain("perf:virtualize");
  });

  it("table module supports html and svg backends", () => {
    const table = getModule("table")!;
    expect(table.supportedBackends).toContain("html");
    expect(table.supportedBackends).toContain("svg");
  });

  it("modules have a11y capabilities", () => {
    const modules = ["chart", "table", "math", "diagram", "text", "code"];
    for (const id of modules) {
      const mod = getModule(id)!;
      expect(mod.capabilities).toContain("a11y:aria");
    }
  });

  it("all modules can be parsed", () => {
    const chart = getModule("chart")!;
    const table = getModule("table")!;
    const math = getModule("math")!;
    const diagram = getModule("diagram")!;
    const text = getModule("text")!;
    const code = getModule("code")!;

    const chartModel = chart.parse({ labels: ["A"], datasets: [{ label: "D", data: [1] }] });
    const tableModel = table.parse({ columns: [{ id: "x", header: "X" }], rows: [{ id: "r1", cells: { x: 1 } }] });
    const mathModel = math.parse("x^2");
    const diagramModel = diagram.parse("graph TD; A-->B;");
    const textModel = text.parse("# Hello");
    const codeModel = code.parse("const x = 1;", { language: "javascript" });

    expect(chartModel.kind).toBe("chart");
    expect(tableModel.kind).toBe("table");
    expect(mathModel.kind).toBe("math");
    expect(diagramModel.kind).toBe("diagram");
    expect(textModel.kind).toBe("text");
    expect(codeModel.kind).toBe("code");
  });

  it("all modules can be measured", () => {
    const chart = getModule("chart")!;
    const table = getModule("table")!;
    const math = getModule("math")!;
    const code = getModule("code")!;

    const ctx = { container: { element: {} } } as any;

    const chartModel = chart.parse({ labels: ["A"], datasets: [{ label: "D", data: [1] }] });
    const chartSize = chart.measure(chartModel, ctx);
    expect(chartSize.intrinsic.width).toBeGreaterThan(0);

    const tableModel = table.parse({ columns: [{ id: "x", header: "X", width: 100 }], rows: [] });
    const tableSize = table.measure(tableModel, ctx);
    expect(tableSize.intrinsic.width).toBe(100);

    const mathModel = math.parse("x^2");
    const mathSize = math.measure(mathModel, ctx);
    expect(mathSize.intrinsic.width).toBeGreaterThan(0);

    const codeModel = code.parse("const x = 1;", { language: "javascript" });
    const codeSize = code.measure(codeModel, ctx);
    expect(codeSize.intrinsic.width).toBeGreaterThan(0);
  });
});