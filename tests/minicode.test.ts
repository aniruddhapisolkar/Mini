import { describe, it, expect } from "vitest";
import { tokenize, getGrammar, listLanguages } from "../MiniCode/tokenizer";
import { getTheme } from "../MiniCode/themes";

describe("MiniCode tokenizer", () => {
  it("tokenizes javascript keywords", () => {
    const toks = tokenize("const x = 42;", "javascript");
    const scopes = toks.map(t => t.scope);
    expect(scopes).toContain("keyword");
    expect(scopes).toContain("number");
  });

  it("tokenizes strings", () => {
    const toks = tokenize('const s = "hello";', "javascript");
    const str = toks.find(t => t.scope === "string");
    expect(str?.text).toBe('"hello"');
  });

  it("tokenizes comments", () => {
    const toks = tokenize("// comment\nconst x = 1;", "javascript");
    expect(toks.some(t => t.scope === "comment")).toBe(true);
  });

  it("supports multiple languages", () => {
    expect(listLanguages().length).toBeGreaterThan(10);
    for (const lang of ["python", "rust", "go", "sql", "json", "css"]) {
      expect(getGrammar(lang)).toBeDefined();
    }
  });

  it("tokenizes python", () => {
    const toks = tokenize("def foo():\n    return 1", "python");
    expect(toks.some(t => t.scope === "keyword" && t.text === "def")).toBe(true);
  });

  it("themes available", () => {
    const t = getTheme("one-dark");
    expect(t.type).toBe("dark");
    expect(t.colors.keyword).toBeDefined();
  });
});
