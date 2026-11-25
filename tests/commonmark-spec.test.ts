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
    .replace(/></g, "> <")
    .replace(/\s+/g, " ")
    .trim();
}

describe("CommonMark 0.31.2 spec conformance", () => {
  it("reports pass rate (informational)", () => {
    let pass = 0;
    const total = spec.length;
    const sectionStats: Record<string, { pass: number; total: number }> = {};
    const failures: Array<{ example: number; section: string; expected: string; actual: string }> = [];
    for (const ex of spec) {
      if (!sectionStats[ex.section]) sectionStats[ex.section] = { pass: 0, total: 0 };
      sectionStats[ex.section]!.total++;
      let actual = "";
      try {
        actual = renderDocument(parseMarkdown(ex.markdown));
      } catch (e) {
        actual = `ERROR: ${(e as Error).message}`;
      }
      if (normalize(actual) === normalize(ex.html)) {
        pass++;
        sectionStats[ex.section]!.pass++;
      } else if (failures.length < 15) {
        failures.push({ example: ex.example, section: ex.section, expected: normalize(ex.html), actual: normalize(actual) });
      }
    }
    // print worst sections
    const worst = Object.entries(sectionStats)
      .map(([s, v]) => ({ s, ...v, rate: v.pass / v.total }))
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 12);
    console.log("Worst sections:");
    for (const w of worst) console.log(`  ${w.s}: ${w.pass}/${w.total} (${(w.rate*100).toFixed(0)}%)`);
    const rate = ((pass / total) * 100).toFixed(1);
    console.log(`CommonMark spec: ${pass}/${total} passed (${rate}%)`);
    for (const f of failures) {
      console.log(`  ex ${f.example} [${f.section}]: expected "${f.expected.slice(0, 80)}" got "${f.actual.slice(0, 80)}"`);
    }
    // Harness baseline: track regressions. Update as compliance improves.
    expect(pass).toBeGreaterThanOrEqual(374);
  });
});