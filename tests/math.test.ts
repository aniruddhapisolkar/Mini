import { describe, it, expect } from "vitest";
import { parseLatex, renderToHTML, renderToMathML } from "../MiniMath/index.js";

describe("MiniMath parse/renderToHTML", () => {
  const cases = [
    "x^2 + y^2 = z^2",
    "\\frac{1}{2}",
    "\\sqrt{2}",
    "\\sqrt[3]{8}",
    "\\alpha + \\beta",
    "\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}",
    "\\begin{cases}x&x>0\\\\-x&x\\le0\\end{cases}",
    "\\binom{n}{k}",
    "\\boxed{x^2}",
    "\\color{red}{x}",
    "\\text{hello}",
    "\\mathbf{B}",
    "\\sum_{i=0}^n i",
    "\\int_0^1 x\\,dx",
    "\\lim_{x\\to0}\\frac{\\sin x}{x}",
    "\\overrightarrow{AB}",
    "\\widehat{x}",
    "\\stackrel{def}{=}",
    "\\xrightarrow[f]{g}",
    "\\fbox{x}",
    "\\mathclap{x}",
    "\\left(\\frac{a}{b}\\right)",
    "\\overline{abc}",
    "\\hat{x}",
    "\\vec{v}",
    "\\begin{aligned}a&=b\\\\c&=d\\end{aligned}",
  ];
  for (const c of cases) {
    it(`renders: ${c.slice(0, 40)}`, () => {
      const out = renderToHTML(c);
      expect(typeof out).toBe("string");
      expect(out.length).toBeGreaterThan(0);
    });
  }
  it("parseLatex returns expr", () => {
    const r = parseLatex("a+b");
    expect(r.expr).toBeTruthy();
    expect(r.error).toBeUndefined();
  });
  it("renderToMathML", () => {
    const out = renderToMathML("x^2");
    expect(out).toContain("math");
  });
  it("handles error gracefully", () => {
    const out = renderToHTML("\\unknowncmd{x}");
    expect(typeof out).toBe("string");
  });
  it("display mode", () => {
    const out = renderToHTML("x^2", { displayMode: true });
    expect(out).toContain("katex");
  });
});
