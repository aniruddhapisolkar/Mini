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

describe("MiniDiagram sequence", () => {
  it("parses sequence diagram", () => {
    const m = parseDiagram("sequenceDiagram\nAlice->>Bob: Hello\nBob-->Alice: Hi");
    expect(m.diagramType).toBe("sequence");
    expect(m.sequence!.participants).toContain("Alice");
    expect(m.sequence!.messages.length).toBe(2);
  });
  it("renders sequence SVG", () => {
    const m = parseDiagram("sequenceDiagram\nA->>B: hi");
    const svg = renderSVG(m);
    expect(svg).toContain("<svg");
    expect(svg).toContain("A");
    expect(svg).toContain("hi");
  });
});

describe("MiniDiagram mindmap", () => {
  it("parses mindmap", () => {
    const m = parseDiagram("mindmap\n  root((central))\n    A\n    B\n      B1");
    expect(m.diagramType).toBe("mindmap");
    expect(m.nodes.length).toBe(4);
    expect(m.edges.length).toBe(3);
  });
  it("renders mindmap SVG", () => {
    const m = parseDiagram("mindmap\n  root\n    child");
    const svg = renderSVG(m);
    expect(svg).toContain("<svg");
  });
});

describe("MiniDiagram pie", () => {
  it("parses pie", () => {
    const m = parseDiagram('pie title Pets\n  "Dogs" : 386\n  "Cats" : 85');
    expect(m.diagramType).toBe("pie");
    expect(m.pie!.slices.length).toBe(2);
  });
  it("renders pie SVG", () => {
    const m = parseDiagram('pie\n  "A" : 10\n  "B" : 20');
    const svg = renderSVG(m);
    expect(svg).toContain("<svg");
    expect(svg).toContain("<path");
  });
});

describe("MiniDiagram gantt", () => {
  it("parses gantt", () => {
    const m = parseDiagram("gantt\ntitle Plan\n  A :a1, 0, 5d\n  B :a2, after a1, 3d");
    expect(m.diagramType).toBe("gantt");
    expect(m.gantt!.tasks.length).toBe(2);
  });
  it("renders gantt SVG", () => {
    const m = parseDiagram("gantt\n  T :t1, 0, 4d");
    const svg = renderSVG(m);
    expect(svg).toContain("<svg");
    expect(svg).toContain("<rect");
  });
});

describe("MiniDiagram state", () => {
  it("parses state diagram", () => {
    const m = parseDiagram("stateDiagram-v2\n[*] --> Still\nStill --> Moving");
    expect(m.diagramType).toBe("state");
    expect(m.edges.length).toBe(2);
  });
  it("renders state SVG", () => {
    const m = parseDiagram("stateDiagram-v2\n[*] --> A\nA --> [*]");
    const svg = renderSVG(m);
    expect(svg).toContain("<svg");
  });
});

describe("MiniDiagram er", () => {
  it("parses er diagram", () => {
    const m = parseDiagram("erDiagram\nCUSTOMER ||--o{ ORDER : places");
    expect(m.diagramType).toBe("er");
    expect(m.nodes.length).toBe(2);
    expect(m.edges.length).toBe(1);
  });
  it("renders er SVG", () => {
    const m = parseDiagram("erDiagram\nA ||--o{ B : has");
    const svg = renderSVG(m);
    expect(svg).toContain("<svg");
  });
});
