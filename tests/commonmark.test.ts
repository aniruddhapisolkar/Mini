import { describe, it, expect } from "vitest";
import { parseMarkdown } from "../MiniText/parser";
import { renderDocument } from "../MiniText/render";

describe("CommonMark spec sanity", () => {
  const cases: Array<[string, string[]]> = [
    ["# Foo", ["<h1", "Foo"]],
    ["## Foo", ["<h2", "Foo"]],
    ["### Foo", ["<h3", "Foo"]],
    ["Foo\n===", ["<h1", "Foo"]],
    ["Foo\n---", ["<h2", "Foo"]],
    ["*emphasis*", ["<em>emphasis</em>"]],
    ["**strong**", ["<strong>strong</strong>"]],
    ["***both***", ["<strong>", "<em>"]],
    ["`code`", ["<code", "code"]],
    ["[link](/url)", ['href="/url"', ">link<"]],
    ["[link](/url \"title\")", ['title="title"']],
    ["![img](/x.png)", ["<img", 'src="/x.png"']],
    ["> quote", ["<blockquote", "quote"]],
    ["---", ["<hr"]],
    ["***", ["<hr"]],
    ["___", ["<hr"]],
    ["* a\n* b", ["<ul", "<li"]],
    ["- a\n- b", ["<ul", "<li"]],
    ["+ a\n+ b", ["<ul", "<li"]],
    ["1. a\n2. b", ["<ol", "<li"]],
    ["5. a\n6. b", ['start="5"']],
    ["```\ncode\n```", ["<pre", "code"]],
    ["```js\ncode\n```", ['class="language-js"']],
    ["    indented code", ["<pre", "indented code"]],
    ["a | b\n---|---\n1 | 2", ["<table", "<th", "<td"]],
    ["~~del~~", ["<del>del</del>"]],
    ["- [x] done", ['type="checkbox"']],
    ["- [ ] todo", ['type="checkbox"']],
    ["foo\nbar", ["foo", "bar"]],
    ["# a\n# b", ["<h1"]],
    ["foo\\\nbar", ["<br"]],
    ["foo  \nbar", ["<br"]],
    ["&amp;", ["&"]],
    ["&#38;", ["&"]],
    ["\\*not emphasis\\*", ["*not emphasis*"]],
    ["<http://example.com>", ['href="http://example.com"']],
    ["> [!NOTE]\n> hi", ["mini-text-callout", "hi"]],
    ["[^1]\n\n[^1]: foot", ["mini-text-footnote", "foot"]],
    ["==mark==", ["<mark>mark</mark>"]],
    ["^sup^", ["<sup>sup</sup>"]],
    ["~sub~", ["<sub>sub</sub>"]],
    ["a\n\nb", ["<p", "</p>"]],
    ["* a\n  * b\n    * c", ["<ul"]],
    ["1. a\n   1. b", ["<ol"]],
    ["```\nline1\nline2\n```", ["line1", "line2"]],
    ["# H\n\npara", ["<h1", "<p"]],
  ];
  for (const [input, expected] of cases) {
    it(`renders: ${input.replace(/\n/g, "\\n").slice(0, 50)}`, () => {
      const doc = parseMarkdown(input);
      const html = renderDocument(doc);
      for (const e of expected) expect(html).toContain(e);
    });
  }
});
