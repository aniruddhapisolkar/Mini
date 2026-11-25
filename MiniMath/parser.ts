// MiniMath — Parser (recursive descent, KaTeX-inspired)

import { Lexer} from "./lexer.js";
import * as N from "./nodes.js";
import {greekLower, greekUpper, bigOps, mathOperators, relations, binOps, delimiters, arrows, misc, accents, fontCommands, sizeCommands} from "./symbols.js";

type Token = import("./lexer.js").Token;

export class ParseError extends Error {
  constructor(msg: string, public loc?: { line: number; column: number }) { super(msg); }
}

export class Parser {
  private tokens: Token[];
  private i: number = 0;
  private mode: "math" | "text";
  private options: { macros?: Record<string, string>; maxExpand?: number; throwOnError?: boolean };
  private expanded: number = 0;

  constructor(input: string, mode: "math" | "text" = "math", options: any = {}) {
    this.tokens = new Lexer(input).tokenize();
    this.mode = mode;
    this.options = options ?? {};
  }

  parse(): N.Expression {
    const expr = this.parseExpression();
    if (this.peek().type !== "eof") throw new ParseError("Unexpected token: " + this.peek().value, this.peek().loc);
    return expr;
  }

  private peek(n = 0): Token { return this.tokens[this.i + n] ?? { type: "eof", value: "", loc: { line: 0, column: 0 } }; }
  private next(): Token { return this.tokens[this.i++]!; }
  private expect(type: string, val?: string) {
    const t = this.peek();
    if (t.type !== type || (val !== undefined && t.value !== val)) throw new ParseError(`Expected ${type}${val ? " " + val : ""}, got ${t.type} ${t.value}`, t.loc);
    return this.next();
  }

  // top-level expression until terminator
  parseExpression(terminator?: Set<string>): N.Expression {
    const nodes: N.ParseNode[] = [];
    while (!this.isTerminator(terminator)) {
      const n = this.parseUnary();
      if (n) nodes.push(n);
    }
    return nodes;
  }

  private isTerminator(t?: Set<string>): boolean {
    const p = this.peek();
    if (p.type === "eof") return true;
    if (p.type === "group_close") return true;
    if (p.type === "align") return true; // & handled by caller
    if (p.type === "sup" || p.type === "sub") return true; // handled by parseSupSub on base
    if (t && t.has(p.value)) return true;
    // \end, \right, \middle terminators handled via commands
    if (p.type === "command" && (p.value === "right" || p.value === "middle" || p.value === "end")) return true;
    if (p.type === "end") return true;
    return false;
  }

  private parseUnary(): N.ParseNode | null {
    const t = this.peek();
    if (t.type === "space") { this.next(); return { type: "spacing", mode: this.mode, width: 0 } as any; }
    if (t.type === "group_open") {
      this.next();
      const inner = this.parseExpression();
      this.expect("group_close");
      // apply sup/sub if present
      return this.parseSupSub({ type: "group", mode: this.mode, body: inner } as any);
    }
    if (t.type === "text") {
      const ch = t.value;
      this.next();
      const node: N.ParseNode = this.mode === "text"
        ? { type: "text", mode: "text", text: ch }
        : { type: "mathord", mode: "math", text: ch };
      return this.parseSupSub(node);
    }
    if (t.type === "command") {
      return this.parseCommand();
    }
    if (t.type === "begin") {
      return this.parseEnvironment();
    }
    if (t.type === "sup") {
      // dangling sup
      this.next();
      const body = this.parseSupSubBody();
      return { type: "supsub", mode: this.mode, sup: body } as N.ParseNode;
    }
    if (t.type === "sub") {
      this.next();
      const body = this.parseSupSubBody();
      return { type: "supsub", mode: this.mode, sub: body } as N.ParseNode;
    }
    // skip unknown
    this.next();
    return null;
  }

  private parseCommand(): N.ParseNode | null {
    const t = this.next(); // command token
    const name = t.value;

    // macro expansion
    if (this.options.macros && this.options.macros[name]) {
      if (this.expanded++ > (this.options.maxExpand ?? 1000)) throw new ParseError("Max expansion exceeded");
      const expanded = this.options.macros[name]!;
      // naive: re-parse by pushing? Instead, parse expanded string recursively
      const p = new Parser(expanded, this.mode, this.options);
      const nodes = p.parse();
      return this.parseSupSub({ type: "macro", mode: this.mode, body: nodes } as any);
    }

    // begin/end handled separately
    if (name === "begin") {
      // \begin{env}
      const envTok = this.peek();
      // expect group_open
      // actually begin token already consumed as command; need {env}
      let envName = "";
      if (this.peek().type === "group_open") {
        this.next();
        envName = this.parseExpression().map(n => (n as any).text ?? "").join("");
        this.expect("group_close");
      }
      return this.parseEnvironmentByName(envName);
    }
    if (name === "end") {
      // shouldn't happen at top
      return null;
    }

    // left/right/middle — \left...\right becomes a single leftright node
    if (name === "left") {
      const delim = this.parseDelimiter();
      const inner: N.Expression = [];
      let depth = 0;
      // tallness estimated after parsing; placeholder size 1.2
      const sizeEst = 1.2;
      while (true) {
        if (this.peek().type === "eof") break;
        if (this.peek().type === "command" && this.peek().value === "right" && depth === 0) break;
        if (this.peek().type === "command" && this.peek().value === "left") depth++;
        if (this.peek().type === "command" && this.peek().value === "right") depth--;
        if (this.peek().type === "command" && this.peek().value === "middle" && depth === 0) {
          this.next();
          const md = this.parseDelimiter();
          inner.push({ type: "middle", mode: this.mode, delim: md, size: sizeEst } as N.ParseNode);
          continue;
        }
        const n = this.parseUnary();
        if (n) inner.push(n);
      }
      const tall = countTall(inner);
      const size = 1 + 0.12 * Math.min(tall, 8);
      let rightDelim = ".";
      if (this.peek().type === "command" && this.peek().value === "right") {
        this.next();
        rightDelim = this.parseDelimiter();
      }
      return this.parseSupSub({ type: "leftright", mode: this.mode, left: delim, right: rightDelim, body: inner, size } as N.ParseNode);
    }
    if (name === "right") {
      const d = this.parseDelimiter();
      return { type: "right", mode: this.mode, delim: d } as N.ParseNode;
    }
    if (name === "middle") {
      const d = this.parseDelimiter();
      return { type: "middle", mode: this.mode, delim: d } as N.ParseNode;
    }

    // fractions
    if (name === "frac" || name === "dfrac" || name === "tfrac" || name === "cfrac") {
      const num = this.parseGroupOrAtom();
      const den = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "genfrac", mode: this.mode, numerator: num, denominator: den, hasBarLine: true, leftDelim: null, rightDelim: null, size: name === "dfrac" ? "display" : name === "tfrac" ? "text" : undefined } as N.ParseNode);
    }
    if (name === "binom" || name === "dbinom" || name === "tbinom") {
      const num = this.parseGroupOrAtom();
      const den = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "binom", mode: this.mode, numerator: num, denominator: den } as N.ParseNode);
    }

    // sqrt
    if (name === "sqrt") {
      let index: N.Expression | undefined;
      if (this.peek().type === "group_open") {
        // optional index in brackets? KaTeX uses \sqrt[3]{x}; handle [ ]
        // We'll handle bracket via group_open of '['? Our lexer doesn't special-case brackets. Treat '[' as text.
      }
      // handle \sqrt[...]
      if (this.peek().type === "text" && this.peek().value === "[") {
        this.next();
        index = this.parseExpression(new Set(["]"]));
        if (this.peek().type === "text" && this.peek().value === "]") this.next();
      }
      const body = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "sqrt", mode: this.mode, body, index } as N.ParseNode);
    }

    // accents
    if (accents[name]) {
      const base = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "accent", mode: this.mode, label: name, base } as N.ParseNode);
    }
    if (name === "overrightarrow" || name === "overleftarrow" || name === "overleftrightarrow" ||
        name === "widehat" || name === "widetilde" || name === "overparen" || name === "underparen" ||
        name === "underleftrightarrow" || name === "overleftharpoon" || name === "overrightharpoon") {
      const base = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "accent", mode: this.mode, label: name, base } as N.ParseNode);
    }
    if (name === "overline" || name === "bar") {
      const base = this.parseGroupOrAtom();
      if (name === "overline") return this.parseSupSub({ type: "overline", mode: this.mode, body: Array.isArray(base) ? base : [base] } as N.ParseNode);
      return this.parseSupSub({ type: "accent", mode: this.mode, label: "bar", base } as N.ParseNode);
    }
    if (name === "underline") {
      const base = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "underline", mode: this.mode, body: Array.isArray(base) ? base : [base] } as N.ParseNode);
    }
    if (name === "overbrace") {
      const base = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "overbrace", mode: this.mode, body: Array.isArray(base) ? base : [base] } as N.ParseNode);
    }
    if (name === "underbrace") {
      const base = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "underbrace", mode: this.mode, body: Array.isArray(base) ? base : [base] } as N.ParseNode);
    }
    if (name === "vec" || name === "hat" || name === "tilde" || name === "dot" || name === "ddot" || name === "check" || name === "breve" || name === "acute" || name === "grave") {
      const base = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "accent", mode: this.mode, label: name, base } as N.ParseNode);
    }

    // phantom
    if (name === "phantom" || name === "vphantom" || name === "hphantom") {
      const body = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "phantom", mode: this.mode, body: Array.isArray(body) ? body : [body], vphantom: name === "vphantom", hphantom: name === "hphantom" } as N.ParseNode);
    }

    // sizing
    if (sizeCommands[name] !== undefined) {
      const body = this.parseExpression();
      return this.parseSupSub({ type: "sizing", mode: this.mode, size: name, body } as N.ParseNode);
    }

    // font styling
    if (fontCommands[name]) {
      const body = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "styling", mode: this.mode, style: fontCommands[name], body: Array.isArray(body) ? body : [body] } as N.ParseNode);
    }

    // spacing commands
    const spacingMap: Record<string, number> = {
      ",": 0.1667, ":": 0.2222, ";": 0.2778, "!": -0.1667,
      quad: 1, qquad: 2, " ": 0.5,
    };
    if (spacingMap[name] !== undefined || name === "hspace" || name === "mspace" || name === "kern" || name === "mkern" || name === "hfill" || name === "hfil" || name === "hfilll") {
      if (name === "hspace" || name === "mspace") {
        // parse dimension argument
        const dim = this.parseDimension();
        return this.parseSupSub({ type: "spacing", mode: this.mode, width: dim } as N.ParseNode);
      }
      if (name === "kern" || name === "mkern") {
        const dim = this.parseDimension();
        return this.parseSupSub({ type: "kern", mode: this.mode, dimension: dim } as N.ParseNode);
      }
      if (name === "hfill" || name === "hfil" || name === "hfilll") {
        return this.parseSupSub({ type: "spacing", mode: this.mode, width: Infinity } as N.ParseNode);
      }
      const w = spacingMap[name] ?? 0;
      return this.parseSupSub({ type: "spacing", mode: this.mode, width: w } as N.ParseNode);
    }

    // big ops
    if (bigOps[name]) {
      const node = { type: "operator", mode: this.mode, text: bigOps[name], big: true, name } as N.ParseNode;
      return this.parseSupSub(node);
    }

    // greek
    if (greekLower[name]) {
      const node = { type: "mathord", mode: this.mode, text: greekLower[name] } as N.ParseNode;
      return this.parseSupSub(node);
    }
    if (greekUpper[name]) {
      const node = { type: "mathord", mode: this.mode, text: greekUpper[name] } as N.ParseNode;
      return this.parseSupSub(node);
    }

    // relations
    if (relations[name]) {
      const node = { type: "rel", mode: this.mode, text: relations[name] } as N.ParseNode;
      return this.parseSupSub(node);
    }
    // bin ops
    if (binOps[name]) {
      const node = { type: "bin", mode: this.mode, text: binOps[name] } as N.ParseNode;
      return this.parseSupSub(node);
    }
    // delimiters
    if (delimiters[name]) {
      const node = { type: "open", mode: this.mode, text: delimiters[name] } as N.ParseNode; // treat generically
      return this.parseSupSub(node);
    }
    // arrows
    if (arrows[name]) {
      const node = { type: "rel", mode: this.mode, text: arrows[name] } as N.ParseNode;
      return this.parseSupSub(node);
    }
    // misc
    if (misc[name]) {
      const node = { type: "mathord", mode: this.mode, text: misc[name] } as N.ParseNode;
      return this.parseSupSub(node);
    }

    // math operators (sin, cos, etc.)
    if (mathOperators.includes(name)) {
      const node = { type: "operator", mode: this.mode, text: name, limits: name === "sum" || name === "prod" || name === "int" } as N.ParseNode;
      // attach following expression? operators just render name; sup/sub handled by parseSupSub
      return this.parseSupSub(node);
    }

    // \text, \mathrm etc handled; \mbox, \hbox
    if (name === "text" || name === "mbox" || name === "hbox") {
      let body: N.Expression = [];
      if (this.peek().type === "group_open") {
        this.next();
        // parse as text mode
        const prevMode = this.mode;
        this.mode = "text";
        body = this.parseExpression();
        this.mode = prevMode;
        this.expect("group_close");
      } else {
        // read next token as text
      }
      return this.parseSupSub({ type: "hbox", mode: this.mode, body } as N.ParseNode);
    }

    // \operatorname
    if (name === "operatorname" || name === "operatorname*" || name === "DeclareMathOperator" || name === "DeclareMathOperator*") {
      let txt = "";
      if (this.peek().type === "group_open") {
        this.next();
        const prevMode = this.mode;
        this.mode = "text";
        const inner = this.parseExpression();
        this.mode = prevMode;
        this.expect("group_close");
        txt = inner.map(n => (n as any).text ?? "").join("");
      }
      return this.parseSupSub({ type: "operatorname", mode: this.mode, name: txt } as N.ParseNode);
    }

    // \color
    if (name === "color" || name === "textcolor") {
      // \color{red}{...} or \color red
      let color = "";
      if (this.peek().type === "group_open") {
        this.next();
        const inner = this.parseExpression();
        this.expect("group_close");
        color = inner.map(n => (n as any).text ?? "").join("");
      } else {
        // single token
        const tk = this.next();
        color = tk.value;
      }
      const body = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "color", mode: this.mode, color, body: Array.isArray(body) ? body : [body] } as N.ParseNode);
    }

    // \boxed
    if (name === "includegraphics") {
      if (this.peek().type === "text" && this.peek().value === "[") {
        this.next();
        this.parseExpression(new Set(["]"]));
        if (this.peek().type === "text" && this.peek().value === "]") this.next();
      }
      let src = "";
      if (this.peek().type === "group_open") {
        this.next();
        const inner = this.parseExpression();
        this.expect("group_close");
        src = inner.map(n => (n as any).text ?? "").join("");
      }
      return this.parseSupSub({ type: "includegraphics", mode: this.mode, src } as N.ParseNode);
    }
    if (name === "colorbox" || name === "fcolorbox") {
      let color = "";
      if (this.peek().type === "group_open") {
        this.next();
        const inner = this.parseExpression();
        this.expect("group_close");
        color = inner.map(n => (n as any).text ?? "").join("");
      }
      const body = this.parseGroupOrAtom();
      if (name === "colorbox") {
        return this.parseSupSub({ type: "colorbox", mode: this.mode, color, body: Array.isArray(body) ? body : [body] } as any);
      }
      return this.parseSupSub({ type: "boxed", mode: this.mode, body: Array.isArray(body) ? body : [body] } as N.ParseNode);
    }
    if (name === "boxed" || name === "fbox" || name === "framebox") {
      const body = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "boxed", mode: this.mode, body: Array.isArray(body) ? body : [body] } as N.ParseNode);
    }

    // \rule{w}{h}
    if (name === "rule") {
      const w = this.parseDimension();
      const h = this.parseDimension();
      let shift = 0;
      // optional [shift]
      return this.parseSupSub({ type: "rule", mode: this.mode, width: w, height: h, shift } as N.ParseNode);
    }

    // \not
    if (name === "not") {
      const base = this.parseGroupOrAtom();
      const b = Array.isArray(base) ? base[0]! : base;
      return this.parseSupSub({ type: "not", mode: this.mode, body: b } as N.ParseNode);
    }

    // \cancel
    if (name === "cancel" || name === "bcancel" || name === "xcancel") {
      const body = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "cancel", mode: this.mode, body: Array.isArray(body) ? body : [body] } as N.ParseNode);
    }

    // \binom handled; \choose
    // \pmod, \mod, \bmod
    if (name === "pmod" || name === "mod" || name === "bmod") {
      const body = this.parseGroupOrAtom();
      const b = Array.isArray(body) ? body : [body];
      return this.parseSupSub({ type: "operatorname", mode: this.mode, name: name === "pmod" ? " (mod " : name === "mod" ? " mod " : " mod ", body: b } as any);
    }

    // cr / line break
    if (name === "cr" || name === "\\" || name === "newline") {
      return { type: "cr", mode: this.mode } as N.ParseNode;
    }

    // vcenter
    if (name === "vcenter") {
      const body = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "vcenter", mode: this.mode, body: Array.isArray(body) ? body : [body] } as N.ParseNode);
    }

    // smash
    if (name === "smash") {
      const body = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "smash", mode: this.mode, body: Array.isArray(body) ? body : [body] } as N.ParseNode);
    }

    // raisebox
    if (name === "raisebox") {
      const amt = this.parseDimension();
      const body = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "raisebox", mode: this.mode, amount: amt, body: Array.isArray(body) ? body : [body] } as N.ParseNode);
    }

    // lap
    if (name === "llap" || name === "rlap" || name === "clap") {
      const body = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "lap", mode: this.mode, side: name[0] as "l" | "r" | "c", body: Array.isArray(body) ? body : [body] } as N.ParseNode);
    }

    // reflectbox
    if (name === "reflectbox") {
      const body = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "reflectbox", mode: this.mode, body: Array.isArray(body) ? body : [body] } as N.ParseNode);
    }

    // html (trust)
    if (name === "htmlData" || name === "htmlClass" || name === "htmlId" || name === "htmlStyle") {
      // skip args
      this.parseGroupOrAtom();
      return this.parseUnary();
    }

    // \tag
    if (name === "tag" || name === "tag*") {
      const body = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "tag", mode: this.mode, body: Array.isArray(body) ? body : [body] } as N.ParseNode);
    }

    // \label, \ref etc. (no-op render)
    if (name === "label" || name === "ref" || name === "eqref") {
      this.parseGroupOrAtom();
      return null;
    }

    // \limits, \nolimits, \displaylimits (no-op flags) — apply to previous? skip
    if (name === "limits" || name === "nolimits" || name === "displaylimits") {
      return null;
    }

    // \left/\right already handled; \big etc delims
    if (name === "big" || name === "Big" || name === "bigg" || name === "Bigg" ||
        name === "bigl" || name === "Bigl" || name === "biggl" || name === "Biggl" ||
        name === "bigr" || name === "Bigr" || name === "biggr" || name === "Biggr" ||
        name === "bigm" || name === "Bigm" || name === "biggm" || name === "Biggm") {
      const d = this.parseDelimiter();
      const scale = name.toLowerCase().startsWith("bigg") ? 2.0 : name.toLowerCase().startsWith("big") ? 1.5 : 1.2;
      // render as sized delimiter
      return this.parseSupSub({ type: "delim", mode: this.mode, text: d, size: scale } as N.ParseNode);
    }

    if (name === "stackrel") {
      const top = this.parseGroupOrAtom();
      const base = this.parseGroupOrAtom();
      const t = Array.isArray(top) ? top : [top];
      const b = Array.isArray(base) ? base : [base];
      return this.parseSupSub({ type: "genfrac", mode: this.mode, numerator: t, denominator: b, hasBarLine: false, leftDelim: null, rightDelim: null } as N.ParseNode);
    }
    if (name === "xrightarrow" || name === "xleftarrow") {
      let below: N.Expression | undefined;
      if (this.peek().type === "text" && this.peek().value === "[") {
        this.next();
        below = this.parseExpression(new Set(["]"]));
        if (this.peek().type === "text" && this.peek().value === "]") this.next();
      }
      const above = this.parseGroupOrAtom();
      const a = Array.isArray(above) ? above : [above];
      const arrow = name === "xrightarrow" ? "→" : "←";
      const baseNode: N.ParseNode = { type: "mathord", mode: this.mode, text: arrow };
      return this.parseSupSub({ type: "supsub", mode: this.mode, base: baseNode, sup: a, sub: below ? (Array.isArray(below) ? below : [below]) : undefined } as N.ParseNode);
    }
    if (name === "mathclap" || name === "mathllap" || name === "mathrlap") {
      const body = this.parseGroupOrAtom();
      return this.parseSupSub(Array.isArray(body) ? (body.length ? body[0]! : { type: "mathord", mode: this.mode, text: "" } as N.ParseNode) : body);
    }
    if (name === "substack") {
      const body = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "environment", mode: this.mode, envName: "substack", body: [Array.isArray(body) ? body : [body]] } as N.ParseNode);
    }
    if (name === "sideset") {
      // \sideset{_a^b}{_c^d}\sum — skip leading groups
      while (this.peek().type === "group_open") { this.next(); this.parseExpression(); this.expect("group_close"); }
      return this.parseUnary();
    }
    if (name === "overset" || name === "underset") {
      const top = this.parseGroupOrAtom();
      const base = this.parseGroupOrAtom();
      const t = Array.isArray(top) ? top : [top];
      const b = Array.isArray(base) ? base : [base];
      if (name === "overset") {
        return this.parseSupSub({ type: "accent", mode: this.mode, label: "overset", base: b[0] ?? { type: "mathord", mode: this.mode, text: "" } as N.ParseNode, top: t } as any);
      }
      return this.parseSupSub({ type: "accent", mode: this.mode, label: "underset", base: b[0] ?? { type: "mathord", mode: this.mode, text: "" } as N.ParseNode, bottom: t } as any);
    }
    if (name === "underleftrightarrow" || name === "overleftharpoon" || name === "overrightharpoon" || name === "overleftarrow" ) {
      const base = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "accent", mode: this.mode, label: name, base } as N.ParseNode);
    }
    if (name === "mathop" || name === "mathbin" || name === "mathrel" || name === "mathopen" || name === "mathclose" || name === "mathpunct" || name === "mathinner" || name === "mathord") {
      const body = this.parseGroupOrAtom();
      const b = Array.isArray(body) ? body : [body];
      return this.parseSupSub(b.length ? b[0]! : { type: "mathord", mode: this.mode, text: "" } as N.ParseNode);
    }
    if (name === "href") {
      // \href{url}{content}
      let url = "";
      if (this.peek().type === "group_open") {
        this.next();
        const inner = this.parseExpression();
        this.expect("group_close");
        url = inner.map(n => (n as any).text ?? "").join("");
      }
      const body = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "href", mode: this.mode, href: url, body: Array.isArray(body) ? body : [body] } as N.ParseNode);
    }
    if (name === "htmlClass" || name === "htmlId" || name === "htmlStyle" || name === "htmlData") {
      // consume class/id/style arg
      let arg = "";
      if (this.peek().type === "group_open") {
        this.next();
        const inner = this.parseExpression();
        this.expect("group_close");
        arg = inner.map(n => (n as any).text ?? "").join("");
      }
      const body = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "html", mode: this.mode, html: "", meta: { kind: name, arg }, body: Array.isArray(body) ? body : [body] } as any);
    }
    if (name === "strut") {
      return this.parseSupSub({ type: "rule", mode: this.mode, width: 0, height: 0.75, shift: -0.25 } as N.ParseNode);
    }
    if (name === "raisebox") {
      const amt = this.parseDimension();
      let height: number | undefined;
      let depth: number | undefined;
      if (this.peek().type === "group_open") {
        // optional [height][depth] before main group? KaTeX: \raisebox{amount}[height][depth]{content}
        // We only support amount here; consume optional bracket groups as no-ops
      }
      const body = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "raisebox", mode: this.mode, amount: amt, body: Array.isArray(body) ? body : [body] } as N.ParseNode);
    }
    if (name === "mathchoice") {
      const d = this.parseGroupOrAtom();
      const t = this.parseGroupOrAtom();
      const sc = this.parseGroupOrAtom();
      const scs = this.parseGroupOrAtom();
      // Default to display style (first)
      const dd = Array.isArray(d) ? d : [d];
      return this.parseSupSub({ type: "group", mode: this.mode, body: dd } as N.ParseNode);
    }
    if (name === "mathpalette") {
      // \mathpalette{fn}{arg}: consume fn and arg, render arg
      this.parseGroupOrAtom();
      const arg = this.parseGroupOrAtom();
      const a = Array.isArray(arg) ? arg : [arg];
      return this.parseSupSub({ type: "group", mode: this.mode, body: a } as N.ParseNode);
    }
    if (name === "subarray") {
      // handled as environment already; if invoked as command, parse group
      const body = this.parseGroupOrAtom();
      const b = Array.isArray(body) ? body : [body];
      return this.parseSupSub({ type: "environment", mode: this.mode, envName: "subarray", body: [b] } as N.ParseNode);
    }
    if (name === "includegraphics") {
      // \includegraphics[opts]{src}
      let opts = "";
      if (this.peek().type === "group_open" && this.peek().value === "[") {
        // bracket not in lexer; handle as group_open with [ text
      }
      // parse optional [..] if present as text token
      if (this.peek().type === "text" && this.peek().value === "[") {
        this.next();
        const inner = this.parseExpression(new Set(["]"]));
        if (this.peek().type === "text" && this.peek().value === "]") this.next();
        opts = inner.map(n => (n as any).text ?? "").join("");
      }
      let src = "";
      if (this.peek().type === "group_open") {
        this.next();
        const inner = this.parseExpression();
        this.expect("group_close");
        src = inner.map(n => (n as any).text ?? "").join("");
      }
      return this.parseSupSub({ type: "includegraphics", mode: this.mode, src, opts } as N.ParseNode);
    }
    if (name === "reflectbox") {
      const body = this.parseGroupOrAtom();
      return this.parseSupSub({ type: "reflectbox", mode: this.mode, body: Array.isArray(body) ? body : [body] } as N.ParseNode);
    }
    if (name === "llap" || name === "rlap" || name === "clap") {
      const body = this.parseGroupOrAtom();
      const b = Array.isArray(body) ? body : [body];
      return this.parseSupSub({ type: "lap", mode: this.mode, side: name[0] as "l" | "r" | "c", body: b } as N.ParseNode);
    }
    // \def\name{...} / \newcommand{\name}{...}
    if (name === "def" || name === "newcommand" || name === "renewcommand" || name === "providecommand") {
      let cmdName = "";
      if (name === "def") {
        // \def\foo#1{...}
        if (this.peek().type === "command") { cmdName = this.next().value; }
      } else {
        if (this.peek().type === "group_open") {
          this.next();
          const inner = this.parseExpression();
          this.expect("group_close");
          cmdName = inner.map(n => (n as any).text ?? "").join("").replace(/^\\/, "");
        }
      }
      // skip optional arg count [n]
      if (this.peek().type === "text" && this.peek().value === "[") {
        this.next();
        this.parseExpression(new Set(["]"]));
        if (this.peek().type === "text" && this.peek().value === "]") this.next();
      }
      // parse body
      let body: N.Expression = [];
      if (this.peek().type === "group_open") {
        this.next();
        body = this.parseExpression();
        this.expect("group_close");
      }
      // register macro (naive: store as string)
      if (cmdName) {
        if (!this.options.macros) this.options.macros = {};
        this.options.macros[cmdName] = body.map(n => (n as any).text ?? "").join("");
      }
      return null;
    }
    if (name === "ce" || name === "cee" || name === "pu") {
      // Basic mhchem-style: parse group as text, apply subscripts/superscripts
      let src = "";
      if (this.peek().type === "group_open") {
        this.next();
        const inner = this.parseExpression();
        this.expect("group_close");
        src = inner.map(n => (n as any).text ?? "").join("");
      } else if (this.peek().type === "text") {
        src = this.next().value;
      }
      // Render as mathord with subscripts via simple transform: digits after letters -> subscript
      const nodes: N.ParseNode[] = [];
      let i = 0;
      while (i < src.length) {
        const ch = src[i]!;
        if (/[A-Za-z]/.test(ch)) {
          let sym = ch;
          i++;
          while (i < src.length && /[A-Za-z]/.test(src[i]!)) { sym += src[i]; i++; }
          nodes.push({ type: "mathord", mode: this.mode, text: sym } as N.ParseNode);
        } else if (/[0-9]/.test(ch)) {
          let num = ch; i++;
          while (i < src.length && /[0-9]/.test(src[i]!)) { num += src[i]; i++; }
          nodes.push({ type: "supsub", mode: this.mode, base: undefined, sub: [{ type: "mathord", mode: this.mode, text: num } as N.ParseNode] } as N.ParseNode);
        } else if (ch === "^") {
          i++;
          let charge = "";
          if (i < src.length && src[i] === "{") { i++; while (i < src.length && src[i] !== "}") { charge += src[i]; i++; } i++; }
          else { charge = src[i] || ""; i++; }
          nodes.push({ type: "supsub", mode: this.mode, sup: [{ type: "mathord", mode: this.mode, text: charge } as N.ParseNode] } as N.ParseNode);
        } else if (ch === "_" || ch === " ") {
          i++;
        } else {
          nodes.push({ type: "mathord", mode: this.mode, text: ch } as N.ParseNode);
          i++;
        }
      }
      return this.parseSupSub({ type: "group", mode: this.mode, body: nodes } as N.ParseNode);
    }
    // default: unknown command -> render as text (or error)
    if (this.options.throwOnError) throw new ParseError("Unknown command: \\" + name, t.loc);
    return this.parseSupSub({ type: "mathord", mode: this.mode, text: "\\" + name } as N.ParseNode);
  }

  private parseEnvironment(): N.ParseNode | null {
    // \begin{env} already? Actually begin token
    if (this.peek().type === "begin") {
      const envName = this.next().value;
      return this.parseEnvironmentByName(envName);
    }
    return null;
  }

  private parseEnvironmentByName(envName: string): N.ParseNode | null {
    // parse body until \end{envName}
    if (envName === "array") {
      // \begin{array}{cols} ... \end{array}
      let colAlign = "";
      if (this.peek().type === "group_open") {
        this.next();
        const inner = this.parseExpression();
        this.expect("group_close");
        colAlign = inner.map(n => (n as any).text ?? "").join("").replace(/\s/g, "");
      }
      const rows = this.parseArrayRows(envName);
      return { type: "array", mode: this.mode, envName, body: rows, colAlign: colAlign.split("") } as N.ParseNode;
    }
    if (envName === "matrix" || envName === "pmatrix" || envName === "bmatrix" || envName === "vmatrix" || envName === "Vmatrix" || envName === "Bmatrix") {
      const rows = this.parseArrayRows(envName);
      const delimMap: Record<string, [string | null, string | null]> = {
        matrix: [null, null], pmatrix: ["(", ")"], bmatrix: ["[", "]"],
        vmatrix: ["|", "|"], Vmatrix: ["‖", "‖"], Bmatrix: ["{", "}"],
      };
      const [l, r] = delimMap[envName] ?? [null, null];
      return { type: "matrix", mode: this.mode, envName, body: rows, leftDelim: l, rightDelim: r } as N.ParseNode;
    }
    if (envName === "cases" || envName === "dcases" || envName === "rcases") {
      const rows = this.parseArrayRows(envName);
      return { type: "cases", mode: this.mode, envName, body: rows } as N.ParseNode;
    }
    if (envName === "aligned" || envName === "gathered" || envName === "align" || envName === "align*" || envName === "eqnarray" || envName === "split" || envName === "flalign" || envName === "multline" || envName === "subarray" || envName === "multline*" || envName === "equation" || envName === "equation*" || envName === "gather" || envName === "gather*") {
      const rows = this.parseArrayRows(envName);
      return { type: "aligned", mode: this.mode, envName, body: rows } as N.ParseNode;
    }
    if (envName === "CD" || envName === "cd") {
      const rows = this.parseArrayRows(envName);
      return { type: "environment", mode: this.mode, envName, body: rows } as N.ParseNode;
    }
    // generic environment: parse until \end
    const body: N.Expression = this.parseExpressionUntilEnd(envName);
    return { type: "environment", mode: this.mode, envName, body: [body] } as N.ParseNode;
  }

  private parseArrayRows(envName: string): N.Expression[] {
    const rows: N.Expression[] = [];
    let currentRow: N.Expression = [];
    let currentCell: N.Expression = [];
    const flushCell = () => { if (currentCell.length) currentRow.push({ type: "group", mode: this.mode, body: currentCell } as any); currentCell = []; };
    const flushRow = () => { flushCell(); rows.push(currentRow); currentRow = []; };
    while (true) {
      const p = this.peek();
      if (p.type === "end") break;
      if (p.type === "eof") break;
      if (p.type === "command" && (p.value === "hline" || p.value === "cline")) {
        this.next();
        if (p.value === "cline") { /* consume optional [range] */ if (this.peek().type === "group_open") { this.next(); this.parseExpression(); this.expect("group_close"); } }
        if (currentCell.length || currentRow.length) { flushCell(); rows.push(currentRow); currentRow = []; }
        rows.push([{ type: "hline", mode: this.mode } as any]);
        continue;
      }
      if (p.type === "align") { this.next(); flushCell(); continue; }
      // cr handled via command token below
      if (p.type === "command" && (p.value == "\\" || p.value === "cr" || p.value === "newline")) { this.next(); flushRow(); continue; }
      const n = this.parseUnary();
      if (n) currentCell.push(n);
    }
    if (currentCell.length || currentRow.length) flushRow();
    if (this.peek().type === "end") this.next();
    return rows;
  }

  // The lexer produces begin/end tokens directly. But parseCommand also handles \begin. 
  // Need to handle 'end' token type.
  private parseExpressionUntilEnd(envName: string): N.Expression {
    const nodes: N.ParseNode[] = [];
    while (!(this.peek().type === "end" && this.peek().value === envName)) {
      if (this.peek().type === "eof") break;
      const n = this.parseUnary();
      if (n) nodes.push(n);
    }
    if (this.peek().type === "end") this.next();
    return nodes;
  }

  private parseGroupOrAtom(): N.Expression | N.ParseNode {
    if (this.peek().type === "group_open") {
      this.next();
      const inner = this.parseExpression();
      this.expect("group_close");
      return inner;
    }
    const n = this.parseUnary();
    return n ?? [];
  }

  private parseSupSubBody(): N.Expression {
    if (this.peek().type === "group_open") {
      this.next();
      const inner = this.parseExpression();
      this.expect("group_close");
      return inner;
    }
    const n = this.parseUnary();
    return n ? [n] : [];
  }

  private parseSupSub(node: N.ParseNode): N.ParseNode {
    // handle ^ and _ following
    let sup: N.Expression | undefined;
    let sub: N.Expression | undefined;
    while (this.peek().type === "sup" || this.peek().type === "sub") {
      if (this.peek().type === "sup") {
        this.next();
        const body = this.parseSupSubBody();
        sup = body;
      } else {
        this.next();
        const body = this.parseSupSubBody();
        sub = body;
      }
    }
    if (sup || sub) {
      return { type: "supsub", mode: this.mode, base: node, sup, sub } as N.ParseNode;
    }
    return node;
  }

  private parseDelimiter(): string {
    const t = this.peek();
    if (t.type === "text" || t.type === "command") {
      // command like \lbrace
      if (t.type === "command") {
        // map command to delimiter char
        const name = t.value;
        if (delimiters[name]) { this.next(); return delimiters[name]!; }
        if (name === "lbrace") { this.next(); return "{"; }
        if (name === "rbrace") { this.next(); return "}"; }
        if (name === "lbrack") { this.next(); return "["; }
        if (name === "rbrack") { this.next(); return "]"; }
        if (name === "lparen") { this.next(); return "("; }
        if (name === "rparen") { this.next(); return ")"; }
        this.next();
        return t.value;
      }
      this.next();
      return t.value;
    }
    if (t.type === "group_open") {
      // {. (null delimiter)
      this.next();
      // expect . then close
      if (this.peek().type === "text" && this.peek().value === ".") this.next();
      this.expect("group_close");
      return ".";
    }
    this.next();
    return t.value;
  }

  private parseDimension(): number {
    // parse a dimension like 1em, 2pt, 3px, or a number
    // skip spaces
    while (this.peek().type === "space") this.next();
    if (this.peek().type === "group_open") {
      this.next();
      const inner = this.parseExpression();
      this.expect("group_close");
      const txt = inner.map(n => (n as any).text ?? "").join("");
      return parseFloat(txt) || 0;
    }
    // read tokens until non-dim
    let numStr = "";
    const t = this.peek();
    if (t.type === "text" || t.type === "command") {
      // could be \quad etc; just consume one token
      this.next();
      // try parse numeric from value
      const m = t.value.match(/-?[\d.]+/);
      return m ? parseFloat(m[0]) : 0;
    }
    return 0;
  }
}


function countTall(expr: N.Expression): number {
  let n = 0;
  for (const node of expr) {
    const t = (node as any).type;
    if (t === "genfrac" || t === "binom" || t === "sqrt" || t === "leftright" || t === "environment" || t === "array" || t === "matrix" || t === "cases" || t === "aligned") n += 2;
    if (t === "supsub") n += 0.5;
    if ((node as any).body && Array.isArray((node as any).body)) n += countTall((node as any).body);
    if ((node as any).numerator) n += countTall((node as any).numerator);
    if ((node as any).denominator) n += countTall((node as any).denominator);
    if ((node as any).base) { try { n += countTall(Array.isArray((node as any).base) ? (node as any).base : [(node as any).base]); } catch {} }
  }
  return n;
}
