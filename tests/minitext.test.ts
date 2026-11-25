import { describe, it, expect } from "vitest";
import { parseMarkdown } from "../MiniText/parser";
import { renderDocument } from "../MiniText/render";

describe("MiniText parser", () => {
  it("parses ATX headings", () => {
    const doc = parseMarkdown("# Hello\n## World");
    expect(doc.children.length).toBe(2);
    expect(doc.children[0].type).toBe("heading");
    expect((doc.children[0] as any).level).toBe(1);
  });

  it("parses paragraphs and emphasis", () => {
    const doc = parseMarkdown("This is **bold** and *italic*.");
    expect(doc.children[0].type).toBe("paragraph");
    const html = renderDocument(doc);
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("parses fenced code blocks", () => {
    const doc = parseMarkdown("```js\nconst x = 1;\n```");
    expect(doc.children[0].type).toBe("codeBlock");
    expect((doc.children[0] as any).language).toBe("js");
    const html = renderDocument(doc);
    expect(html).toContain("const");
    expect(html).toContain(">1<");
  });

  it("parses GFM tables", () => {
    const md = "| a | b |\n|---|---|\n| 1 | 2 |";
    const doc = parseMarkdown(md);
    expect(doc.children[0].type).toBe("table");
    const html = renderDocument(doc);
    expect(html).toContain("<table");
    expect(html).toContain("<th");
  });

  it("parses task lists", () => {
    const md = "- [ ] todo\n- [x] done";
    const doc = parseMarkdown(md);
    expect(doc.children[0].type).toBe("list");
    const html = renderDocument(doc);
    expect(html).toContain('type="checkbox"');
  });

  it("parses blockquotes", () => {
    const doc = parseMarkdown("> quote");
    expect(doc.children[0].type).toBe("blockquote");
  });

  it("renders tight lists without paragraph wrappers", () => {
    const html = renderDocument(parseMarkdown("- a\n- b"));
    expect(html).not.toContain("<p");
    expect(html).toContain("<li");
  });

  it("renders loose lists with paragraph wrappers", () => {
    const html = renderDocument(parseMarkdown("- a\n\n- b"));
    expect(html).toContain("<p");
  });

  it("parses thematic break", () => {
    const doc = parseMarkdown("---");
    expect(doc.children[0].type).toBe("thematicBreak");
  });

  it("parses links and images", () => {
    const doc = parseMarkdown("[link](https://example.com) ![img](a.png)");
    const html = renderDocument(doc);
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain("<img");
  });

  it("parses strikethrough (GFM)", () => {
    const doc = parseMarkdown("~~deleted~~");
    const html = renderDocument(doc);
    expect(html).toContain("<del>deleted</del>");
  });

  it("parses inline code", () => {
    const doc = parseMarkdown("use `foo()` here");
    const html = renderDocument(doc);
    expect(html).toContain("<code");
    expect(html).toContain("foo()");
  });
});
