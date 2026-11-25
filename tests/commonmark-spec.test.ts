import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseMarkdown } from "../MiniText/parser";
import { renderDocument } from "../MiniText/render";

interface SpecExample {
  markdown: string;
  html: string;
  example: number;
  section: string;
}

const spec: SpecExample[] = JSON.parse(readFileSync(new URL("./spec.json", import.meta.url), "utf8"));

function normalize(html: string): string {
  return html
    .replace(/\s*class="[^"]*"/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

describe("CommonMark 0.31.2 spec conformance", () => {
  it("reports pass rate (informational)", () => {
    let pass = 0;
    const total = spec.length;
    const failures: Array<{ example: number; section: string; expected: string; actual: string }> = [];
    for (const ex of spec) {
      let actual = "";
      try {
        actual = renderDocument(parseMarkdown(ex.markdown));
      } catch (e) {
        actual = `ERROR: ${(e as Error).message}`;
      }
      if (normalize(actual) === normalize(ex.html)) {
        pass++;
      } else if (failures.length < 20) {
        failures.push({ example: ex.example, section: ex.section, expected: normalize(ex.html), actual: normalize(actual) });
      }
    }
    const rate = ((pass / total) * 100).toFixed(1);
    console.log(`CommonMark spec: ${pass}/${total} passed (${rate}%)`);
    for (const f of failures) {
      console.log(`  ex ${f.example} [${f.section}]: expected "${f.expected.slice(0, 80)}" got "${f.actual.slice(0, 80)}"`);
    }
    // Harness baseline: track regressions. Update as compliance improves.
    expect(pass).toBeGreaterThanOrEqual(268);
  });
});