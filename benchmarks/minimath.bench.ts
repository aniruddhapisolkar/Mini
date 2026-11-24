import { bench, describe } from "vitest";
import { parseLatex, renderToHTML, renderToMathML } from "../MiniMath/index";

const small = "x^2 + y^2 = z^2";
const medium = "\\frac{1}{2} + \\sqrt{x} + \\sum_{i=0}^n i + \\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}";
const large = (medium + " ").repeat(20);

describe("MiniMath parse", () => {
  bench("small expr", () => { parseLatex(small); });
  bench("medium expr", () => { parseLatex(medium); });
  bench("large expr (20x)", () => { parseLatex(large); });
});

describe("MiniMath renderToHTML", () => {
  bench("small expr", () => { renderToHTML(small); });
  bench("medium expr", () => { renderToHTML(medium); });
  bench("large expr (20x)", () => { renderToHTML(large); });
});

describe("MiniMath renderToMathML", () => {
  bench("medium expr", () => { renderToMathML(medium); });
});
