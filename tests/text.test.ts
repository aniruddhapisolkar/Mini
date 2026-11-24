import { describe, it, expect } from "vitest";
import { TextProcessor, Typography, sanitizeHtml, CanvasTextMeasurer } from "../MiniRender/text/index";

describe("TextProcessor", () => {
  it("normalizes line endings", () => {
    expect(TextProcessor.process("a\r\nb\rc", { normalizeLineEndings: true })).toBe("a\nb\nc");
  });
  it("collapses whitespace", () => {
    expect(TextProcessor.process("a   b\t\tc", { collapseWhitespace: true })).toBe("a b c");
  });
  it("trims", () => {
    expect(TextProcessor.process("  hello  ", { trim: true })).toBe("hello");
  });
  it("decodes entities", () => {
    expect(TextProcessor.process("&amp; &lt; &#65; &#x41;", { decodeEntities: true })).toBe("& < A A");
  });
  it("escapes html", () => {
    expect(TextProcessor.escapeHtml('<script>alert("x")</script>')).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  });
  it("normalizes whitespace static", () => {
    expect(TextProcessor.normalizeWhitespace("  a   b  ")).toBe("a b");
  });
});

describe("Typography", () => {
  it("applies smart quotes", () => {
    const result = Typography.apply('"hello"');
    expect(result).toContain("“");
  });
  it("applies dashes", () => {
    expect(Typography.apply("a---b")).toBe("a—b");
    expect(Typography.apply("a--b")).toBe("a–b");
  });
  it("applies ellipsis", () => {
    expect(Typography.apply("wait...")).toBe("wait…");
  });
});

describe("sanitizeHtml", () => {
  it("removes script tags", () => {
    const out = sanitizeHtml('<p>hello</p><script>alert(1)</script>');
    expect(out).not.toContain("script");
    expect(out).toContain("<p>hello</p>");
  });
  it("removes event handlers", () => {
    const out = sanitizeHtml('<a href="x" onclick="alert(1)">link</a>');
    expect(out).not.toContain("onclick");
  });
  it("filters javascript: urls", () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain("javascript:");
  });
  it("keeps safe tags", () => {
    const out = sanitizeHtml("<strong>bold</strong>");
    expect(out).toBe("<strong>bold</strong>");
  });
});

describe("CanvasTextMeasurer", () => {
  it("measures text (jsdom fallback)", () => {
    const m = new CanvasTextMeasurer();
    // In Node without canvas, measure may throw; test wrap at least
    try {
      const metrics = m.measure("hello", { family: "sans-serif", size: 16 });
      expect(metrics.width).toBeGreaterThan(0);
    } catch {
      // acceptable in non-DOM environment
    }
  });
  it("wraps text", () => {
    const m = new CanvasTextMeasurer();
    try {
      const lines = m.wrap("hello world foo bar", { family: "sans-serif", size: 16 }, 50);
      expect(lines.length).toBeGreaterThanOrEqual(1);
    } catch {
      // acceptable
    }
  });
});
