// MiniMath — Lexer
// Produces a flat token stream from a LaTeX math string.

export type TokenType =
  | "text" | "command" | "begin" | "end" | "group_open" | "group_close"
  | "sup" | "sub" | "align" | "space" | "comment" | "eof";

export interface Token {
  type: TokenType;
  value: string;
  loc: { line: number; column: number };
}

export class Lexer {
  private src: string;
  private i: number = 0;
  private line: number = 1;
  private col: number = 1;

  constructor(src: string) { this.src = src; }

  tokenize(): Token[] {
    const toks: Token[] = [];
    while (this.i < this.src.length) {
      const c = this.src[this.i]!;
      if (c === "\n") { this.i++; this.line++; this.col = 1; toks.push({ type: "space", value: " ", loc: { line: this.line, column: this.col } }); continue; }
      if (c === " " || c === "\t" || c === "\r") { this.i++; this.col++; toks.push({ type: "space", value: " ", loc: { line: this.line, column: this.col } }); continue; }
      if (c === "%") {
        while (this.i < this.src.length && this.src[this.i] !== "\n") { this.i++; this.col++; }
        continue;
      }
      if (c === "\\") {
        // command or environment
        if (this.src[this.i + 1] === " ") { this.i += 2; this.col += 2; toks.push({ type: "space", value: " ", loc: { line: this.line, column: this.col } }); continue; }
        // \begin{...} / \end{...}
        const mBegin = this.src.slice(this.i).match(/^\\(begin|end)\{([^}]*)\}/);
        if (mBegin) {
          const kind = mBegin[1] === "begin" ? "begin" : "end";
          toks.push({ type: kind as TokenType, value: mBegin[2]!, loc: { line: this.line, column: this.col } });
          this.i += mBegin[0].length; this.col += mBegin[0].length; continue;
        }
        // command name
        let j = this.i + 1;
        if (/[a-zA-Z]/.test(this.src[j] ?? "")) {
          while (j < this.src.length && /[a-zA-Z]/.test(this.src[j]!)) j++;
          const name = this.src.slice(this.i + 1, j);
          toks.push({ type: "command", value: name, loc: { line: this.line, column: this.col } });
          const len = j - this.i;
          this.i = j;
          this.col += len;
          continue;
        } else if (this.i + 1 < this.src.length) {
          const ch = this.src[this.i + 1]!;
          toks.push({ type: "command", value: ch, loc: { line: this.line, column: this.col } });
          this.i += 2; this.col += 2; continue;
        }
      }
      if (c === "{") { toks.push({ type: "group_open", value: "{", loc: { line: this.line, column: this.col } }); this.i++; this.col++; continue; }
      if (c === "}") { toks.push({ type: "group_close", value: "}", loc: { line: this.line, column: this.col } }); this.i++; this.col++; continue; }
      if (c === "^") { toks.push({ type: "sup", value: "^", loc: { line: this.line, column: this.col } }); this.i++; this.col++; continue; }
      if (c === "_") { toks.push({ type: "sub", value: "_", loc: { line: this.line, column: this.col } }); this.i++; this.col++; continue; }
      if (c === "&") { toks.push({ type: "align", value: "&", loc: { line: this.line, column: this.col } }); this.i++; this.col++; continue; }
      if (c === "~") { toks.push({ type: "space", value: "\u00A0", loc: { line: this.line, column: this.col } }); this.i++; this.col++; continue; }
      // default text char
      toks.push({ type: "text", value: c, loc: { line: this.line, column: this.col } });
      this.i++; this.col++;
    }
    toks.push({ type: "eof", value: "", loc: { line: this.line, column: this.col } });
    return toks;
  }
}
