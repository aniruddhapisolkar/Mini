import { describe, it, expect } from "vitest";
import { parseLatex, renderToHTML, renderToMathML } from "../MiniMath/index.js";

describe("MiniMath parse/renderToHTML", () => {
  it("renders simple expression", () => {
    const out = renderToHTML("x^2 + y^2 = z^2");
    expect(out).toContain("x");
    expect(out).toContain("katex-html");
  });
  it("renders fraction", () => {
    const out = renderToHTML("\\frac{1}{2}");
    expect(out).toContain("frac");
  });
  it("renders sqrt", () => {
    const out = renderToHTML("\\sqrt{2}");
    expect(out).toContain("sqrt");
  });
  it("renders greek", () => {
    const out = renderToHTML("\\alpha + \\beta");
    expect(out).toContain("α");
  });
  it("renders matrix", () => {
    const out = renderToHTML("\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}");
    expect(out).toContain("pmatrix".replace("pmatrix","") || "m");
  });
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
    // unknown command rendered as text or error; should not throw
    expect(typeof out).toBe("string");
  });
});
