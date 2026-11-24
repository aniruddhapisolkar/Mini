// MiniRender — shared text processing utilities (Phase 1, Jimbo)
// TextProcessor, Typography, sanitizeHtml. Used by MiniText, MiniCode, and cross-module embedding.

import type { FontSpec } from "../core/types";

// ---- TextProcessor ----

export interface TextProcessorOptions {
  /** Collapse multiple whitespace into single space. Default: false. */
  collapseWhitespace?: boolean;
  /** Trim leading/trailing whitespace. Default: false. */
  trim?: boolean;
  /** Normalize line endings to \n. Default: true. */
  normalizeLineEndings?: boolean;
  /** Decode HTML entities (&amp; -> &). Default: false. */
  decodeEntities?: boolean;
}

export class TextProcessor {
  private opts: Required<TextProcessorOptions>;

  constructor(options: TextProcessorOptions = {}) {
    this.opts = {
      collapseWhitespace: options.collapseWhitespace ?? false,
      trim: options.trim ?? false,
      normalizeLineEndings: options.normalizeLineEndings ?? true,
      decodeEntities: options.decodeEntities ?? false,
    };
  }

  process(input: string): string {
    let s = input;
    if (this.opts.normalizeLineEndings) {
      s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    }
    if (this.opts.decodeEntities) {
      s = decodeHtmlEntities(s);
    }
    if (this.opts.collapseWhitespace) {
      s = s.replace(/[^\S\n]+/g, " ");
    }
    if (this.opts.trim) {
      s = s.trim();
    }
    return s;
  }

  /** Static convenience. */
  static process(input: string, options?: TextProcessorOptions): string {
    return new TextProcessor(options).process(input);
  }

  /** Escape HTML special characters. */
  static escapeHtml(input: string): string {
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** Normalize whitespace for measurement/layout (collapse runs, trim). */
  static normalizeWhitespace(input: string): string {
    return input.replace(/\s+/g, " ").trim();
  }
}

// ---- HTML entity decoding ----

const ENTITY_MAP: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00A0",
  copy: "©", reg: "®", trade: "™", hellip: "…", mdash: "—", ndash: "–",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
};

export function decodeHtmlEntities(input: string): string {
  return input.replace(/&(?:#(\d+)|#x([0-9a-fA-F]+)|([a-zA-Z]+));/g, (_m, dec, hex, name) => {
    if (dec) return String.fromCodePoint(parseInt(dec, 10));
    if (hex) return String.fromCodePoint(parseInt(hex, 16));
    if (name && ENTITY_MAP[name]) return ENTITY_MAP[name];
    return _m;
  });
}

// ---- sanitizeHtml ----

export interface SanitizeOptions {
  /** Allowed tags. Default: common safe tags. */
  allowedTags?: string[];
  /** Allowed attributes per tag. Default: limited safe attributes. */
  allowedAttrs?: Record<string, string[]>;
  /** Drop content of disallowed tags entirely (vs. keeping inner text). Default: false. */
  dropContent?: boolean;
}

const DEFAULT_ALLOWED_TAGS = [
  "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "em", "b", "i", "u", "s", "del", "ins", "mark", "sub", "sup", "code", "pre",
  "a", "img", "blockquote", "q", "cite",
  "ul", "ol", "li", "dl", "dt", "dd",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
  "span", "div", "section", "article", "header", "footer", "nav", "main", "aside",
  "figure", "figcaption", "details", "summary",
];

const DEFAULT_ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height"],
  "*": ["class", "id", "style", "lang", "dir"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan", "scope"],
  col: ["span", "width"],
  ol: ["start", "type"],
};

export function sanitizeHtml(input: string, options: SanitizeOptions = {}): string {
  const allowedTags = new Set(options.allowedTags ?? DEFAULT_ALLOWED_TAGS);
  const allowedAttrs = options.allowedAttrs ?? DEFAULT_ALLOWED_ATTRS;
  const dropContent = options.dropContent ?? false;

  // Disallowed tags whose content should be dropped
  const dropTags = new Set(["script", "style", "iframe", "object", "embed", "form", "input", "textarea", "select", "button"]);

  // We do a regex-based sanitizer (sufficient for Phase 1; full DOMPurify-level later).
  // Strategy: parse tags, filter allowed, sanitize attributes, escape disallowed.

  let result = "";
  let i = 0;
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // We'll process by finding all tags
  const tokens: Array<{ type: "text" | "tag"; value: string; tag?: string; closing?: boolean }> = [];
  let m: RegExpExecArray | null;
  const re = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/g;
  let pos = 0;
  while ((m = re.exec(input)) !== null) {
    if (m.index > pos) {
      tokens.push({ type: "text", value: input.slice(pos, m.index) });
    }
    const full = m[0];
    const tagName = (m[1] ?? "").toLowerCase();
    const closing = full.startsWith("</");
    tokens.push({ type: "tag", value: full, tag: tagName, closing });
    pos = m.index + full.length;
  }
  if (pos < input.length) {
    tokens.push({ type: "text", value: input.slice(pos) });
  }

  // Track drop depth
  let dropDepth = 0;
  for (const tok of tokens) {
    if (tok.type === "text") {
      if (dropDepth === 0) result += tok.value;
      continue;
    }
    const tag = tok.tag ?? "";
    if (dropTags.has(tag)) {
      if (tok.closing) {
        if (dropDepth > 0) dropDepth--;
      } else {
        dropDepth++;
      }
      continue;
    }
    if (dropDepth > 0) continue;

    if (!allowedTags.has(tag)) {
      // Keep inner text (already added as text tokens); skip tag
      continue;
    }

    if (tok.closing) {
      result += `</${tag}>`;
      continue;
    }

    // Sanitize attributes
    const attrMatch = tok.value.match(/<\w+\s*([^>]*)>/);
    const attrStr = attrMatch ? (attrMatch[1] ?? "") : "";
    const attrs = sanitizeAttributes(tag, attrStr, allowedAttrs);
    const selfClosing = tok.value.endsWith("/>") || ["br", "hr", "img", "col", "input"].includes(tag);
    result += `<${tag}${attrs ? " " + attrs : ""}${selfClosing ? " /" : ""}>`;
  }

  return result;
}

function sanitizeAttributes(tag: string, attrStr: string, allowedAttrs: Record<string, string[]>): string {
  const tagAllowed = allowedAttrs[tag] ?? [];
  const globalAllowed = allowedAttrs["*"] ?? [];
  const allAllowed = new Set([...tagAllowed, ...globalAllowed]);

  const attrRegex = /(\w[\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  const parts: string[] = [];
  let am: RegExpExecArray | null;
  while ((am = attrRegex.exec(attrStr)) !== null) {
    const name = (am[1] ?? "").toLowerCase();
    if (!allAllowed.has(name)) continue;
    const value = am[2] ?? am[3] ?? am[4] ?? "";

    // Filter unsafe URLs
    if (name === "href" || name === "src") {
      const trimmed = value.trim().toLowerCase();
      if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:text/html") || trimmed.startsWith("vbscript:")) {
        continue;
      }
    }

    // Filter style for dangerous content
    if (name === "style") {
      if (/expression|javascript|url\s*\(/i.test(value)) continue;
    }

    if (value === "" && !am[0].includes("=")) {
      parts.push(name);
    } else {
      parts.push(`${name}="${TextProcessor.escapeHtml(value)}"`);
    }
  }

  // Force safe target/rel for links
  // (handled by caller if needed)

  return parts.join(" ");
}

// ---- Typography ----

export interface TypographyOptions {
  smartQuotes?: boolean;
  dashes?: boolean;
  ellipsis?: boolean;
  nonBreakingSpaces?: boolean;
}

export class Typography {
  private opts: Required<TypographyOptions>;

  constructor(options: TypographyOptions = {}) {
    this.opts = {
      smartQuotes: options.smartQuotes ?? true,
      dashes: options.dashes ?? true,
      ellipsis: options.ellipsis ?? true,
      nonBreakingSpaces: options.nonBreakingSpaces ?? false,
    };
  }

  apply(input: string): string {
    let s = input;
    if (this.opts.smartQuotes) s = applySmartQuotes(s);
    if (this.opts.dashes) s = applyDashes(s);
    if (this.opts.ellipsis) s = applyEllipsis(s);
    if (this.opts.nonBreakingSpaces) s = applyNonBreakingSpaces(s);
    return s;
  }

  static apply(input: string, options?: TypographyOptions): string {
    return new Typography(options).apply(input);
  }
}

function applySmartQuotes(input: string): string {
  // Simple heuristic: replace straight quotes with curly quotes
  let s = input;
  // Double quotes
  s = s.replace(/"(\w)/g, "“$1");
  s = s.replace(/(\w)"/g, "$1”");
  s = s.replace(/"(\s)/g, "“$1");
  // Single quotes / apostrophes
  s = s.replace(/'(\w)/g, "‘$1");
  s = s.replace(/(\w)'/g, "$1’");
  return s;
}

function applyDashes(input: string): string {
  let s = input;
  // Em dash: --- or -- with spaces
  s = s.replace(/---/g, "—");
  // En dash: -- (but not ---)
  s = s.replace(/--/g, "–");
  return s;
}

function applyEllipsis(input: string): string {
  return input.replace(/\.\.\./g, "…");
}

function applyNonBreakingSpaces(input: string): string {
  // Replace space before certain punctuation with non-breaking space
  return input.replace(/ ([:;!?])/g, "\u00A0$1");
}

// ---- TextMeasurer (canvas-based implementation) ----

import type { TextMeasurer, TextMetrics } from "../core/types";

export class CanvasTextMeasurer implements TextMeasurer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private getContext(): CanvasRenderingContext2D {
    if (!this.ctx) {
      if (typeof document !== "undefined") {
        this.canvas = document.createElement("canvas");
        const c = this.canvas.getContext("2d");
        if (!c) throw new Error("Canvas 2D context unavailable");
        this.ctx = c;
      } else {
        throw new Error("CanvasTextMeasurer requires a DOM environment");
      }
    }
    return this.ctx!;
  }

  private setFont(font: FontSpec): void {
    const ctx = this.getContext();
    const style = font.style ?? "normal";
    const weight = font.weight ?? "normal";
    ctx.font = `${style} ${weight} ${font.size}px ${font.family}`;
  }

  measure(text: string, font: FontSpec): TextMetrics {
    this.setFont(font);
    const ctx = this.getContext();
    const m = ctx.measureText(text);
    const height = font.lineHeight ?? font.size * 1.2;
    return {
      width: m.width,
      height,
      ascent: m.actualBoundingBoxAscent ?? height * 0.8,
      descent: m.actualBoundingBoxDescent ?? height * 0.2,
    };
  }

  measureRange(text: string, font: FontSpec, start: number, end: number): TextMetrics {
    return this.measure(text.slice(start, end), font);
  }

  lineHeight(font: FontSpec): number {
    return font.lineHeight ?? font.size * 1.2;
  }

  wrap(text: string, font: FontSpec, maxWidth: number): string[] {
    const words = text.split(/(\s+)/);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const test = current + word;
      const metrics = this.measure(test, font);
      if (metrics.width > maxWidth && current.length > 0) {
        lines.push(current.trimEnd());
        current = word.trimStart();
      } else {
        current = test;
      }
    }
    if (current.trim().length > 0) lines.push(current.trimEnd());
    if (lines.length === 0) lines.push("");
    return lines;
  }
}

// ---- Span helper ----

export interface Span {
  text: string;
  kind: string;
  range: [number, number];
  children?: Span[];
  style?: Record<string, string>;
}

export function createSpan(text: string, kind: string, start: number, end: number, children?: Span[], style?: Record<string, string>): Span {
  const s: Span = { text, kind, range: [start, end] };
  if (children) s.children = children;
  if (style) s.style = style;
  return s;
}

// ---- Export as a namespace-like object for convenience ----

export const Text = {
  Processor: TextProcessor,
  Typography,
  sanitizeHtml,
  CanvasTextMeasurer,
  createSpan,
  decodeHtmlEntities,
};
