import { bench, describe } from "vitest";
import { parseMarkdown } from "../MiniText/parser";
import { renderDocument } from "../MiniText/render";

const small = "# Hello\n\nParagraph with **bold** and *italic*.\n\n- a\n- b\n";
const medium = (small + "\n").repeat(50);
const large = (small + "\n").repeat(500);

describe("MiniText parse", () => {
  bench("small doc", () => { parseMarkdown(small); });
  bench("medium doc (50x)", () => { parseMarkdown(medium); });
  bench("large doc (500x)", () => { parseMarkdown(large); });
});

describe("MiniText render", () => {
  const smallDoc = parseMarkdown(small);
  const mediumDoc = parseMarkdown(medium);
  bench("small doc", () => { renderDocument(smallDoc); });
  bench("medium doc (50x)", () => { renderDocument(mediumDoc); });
});

describe("MiniText tokenize (code blocks)", () => {
  const src = "```js\nconst x = 1;\n```\n".repeat(100);
  bench("100 code blocks", () => { parseMarkdown(src); });
});
