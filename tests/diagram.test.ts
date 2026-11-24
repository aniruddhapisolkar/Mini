import { describe, it, expect } from "vitest";
import { parseDiagram, renderSVG } from "../MiniDiagram/index.js";

describe("MiniDiagram", () => {
  it("parses simple flowchart", () => {
    const m = parseDiagram("graph TD\nA[Start] --> B[End]");
    expect(m.nodes.length).toBe(2);
    expect(m.edges.length).toBe(1);
    expect(m.edges[0].from).toBe("A");
    expect(m.edges[0].to).toBe("B");
  });
  it("renders SVG", () => {
    const m = parseDiagram("graph LR\nA --> B\nB --> C");
    const svg = renderSVG(m);
    expect(svg).toContain("<svg");
    expect(svg).toContain("A");
    expect(svg).toContain("C");
  });
  it("handles subgraph", () => {
    const m = parseDiagram("graph TD\nsubgraph Group\nA --> B\nend");
    expect(m.subgraphs.length).toBe(1);
  });
  it("handles edge labels", () => {
    const m = parseDiagram("graph TD\nA -->|yes| B");
    expect(m.edges[0].label).toBe("yes");
  });
});
