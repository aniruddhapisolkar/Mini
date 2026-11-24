// MiniCode — Type definitions (Phase 2)

export type TokenScope =
  | "comment"
  | "string"
  | "keyword"
  | "number"
  | "operator"
  | "punctuation"
  | "function"
  | "class"
  | "variable"
  | "property"
  | "type"
  | "constant"
  | "tag"
  | "attribute"
  | "regexp"
  | "escape"
  | "meta"
  | "macro"
  | "symbol"
  | "key"
  | "section"
  | "selector"
  | "plain";

export interface CodeToken {
  text: string;
  scope: TokenScope;
  line: number;
  column: number;
}

export interface CodeModel {
  kind: "code";
  version: number;
  source: string;
  language: string;
  tokens: CodeToken[];
  lines: string[];
}

export interface LanguageGrammar {
  id: string;
  aliases?: string[];
  rules: Array<{ scope: TokenScope; pattern: RegExp }>;
}

export interface Theme {
  id: string;
  name: string;
  type: "light" | "dark";
  colors: Partial<Record<TokenScope, string>>;
  background: string;
  foreground: string;
}
