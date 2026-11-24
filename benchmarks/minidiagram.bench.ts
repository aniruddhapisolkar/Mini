import { bench, describe } from "vitest";
import { parseDiagram, renderSVG } from "../MiniDiagram/index";

const small = "graph TD\nA --> B\nB --> C";
const medium = "graph TD\n" + Array.from({length: 20}, (_, i) => `n${i} --> n${i+1}`).join("\n");
const large = "graph TD\n" + Array.from({length: 200}, (_, i) => `n${i} --> n${(i+1)%200}`).join("\n");

describe("MiniDiagram parse", () => {
  bench("small", () => { parseDiagram(small); });
  bench("medium (20 nodes)", () => { parseDiagram(medium); });
  bench("large (200 nodes)", () => { parseDiagram(large); });
});

describe("MiniDiagram renderSVG", () => {
  const sm = parseDiagram(small);
  const md = parseDiagram(medium);
  bench("small", () => { renderSVG(sm); });
  bench("medium (20 nodes)", () => { renderSVG(md); });
});

describe("MiniDiagram sequence", () => {
  const src = "sequenceDiagram\n" + Array.from({length: 20}, (_, i) => `A->>B: msg${i}`).join("\n");
  bench("20 messages", () => { const m = parseDiagram(src); renderSVG(m); });
});
