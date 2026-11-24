import { describe, it, expect } from "vitest";
import { parseMarkdown } from "../MiniText/parser";
import { renderDocument } from "../MiniText/render";

describe("CommonMark sanity", () => {
  const cases: Array<[string, string[]]> = [
    ["# Foo", ["<h1", "Foo", "</h1>"]],
    ["## Foo", ["<h2", "Foo"]],
    ["*emphasis*", ["<em>emphasis</em>"]],
    ["**strong**", ["<strong>strong</strong>"]],
    ["`code`", ["<code", "code", "</code>"]],
    ["[link](/url)", ['href="/url"', ">link<"]],
    ["![img](/x.png)", ["<img", 'src="/x.png"']],
    ["> quote", ["<blockquote", "quote"]],
    ["---", ["<hr"]],
    ["* a\n* b", ["<ul", "<li"]],
    ["1. a\n2. b", ["<ol", "<li"]],
    ["```\ncode\n```", ["<pre", "code"]],
    ["a | b\n---|---\n1 | 2", ["<table", "<th", "<td"]],
    ["~~del~~", ["<del>del</del>"]],
    ["- [x] done", ['type="checkbox"']],
  ];
  for (const [input, expected] of cases) {
    it(`renders: ${input.replace(/\n/g, "\\n").slice(0, 40)}`, () => {
      const doc = parseMarkdown(input);
      const html = renderDocument(doc);
      for (const e of expected) expect(html).toContain(e);
    });
  }
});
