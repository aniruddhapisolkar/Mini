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
});