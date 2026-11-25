// MiniText — Markdown parser (CommonMark core + GFM + Mini extensions)
// Phase 2 implementation. Not yet full spec compliance; see tests for covered constructs.

import type { BlockNode, InlineNode, LinkReference, TextDocument } from "./types.js";
import { HTML5_ENTITIES } from "./entities.js";

export interface ParseOptions {
  gfm?: boolean;
  footnotes?: boolean;
  callouts?: boolean;
  extensions?: boolean;
}

const DEFAULT_OPTS: Required<ParseOptions> = {
  gfm: true,
  footnotes: true,
  callouts: true,
  extensions: true,
};

// ---------- utilities ----------

function normalizeNewlines(src: string): string {
  return src.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function expandTabs(line: string): string {
  let result = "";
  let col = 0;
  for (const ch of line) {
    if (ch === "\t") {
      const spaces = 4 - (col % 4);
      result += " ".repeat(spaces);
      col += spaces;
    } else {
      result += ch;
      col++;
    }
  }
  return result;
}

function splitLines(src: string): string[] {
  const lines = normalizeNewlines(src).split("\n");
  // expand tabs to 4-space tab stops (CommonMark)
  return lines.map(expandTabs);
}

function isBlank(line: string): boolean {
  return /^\s*$/.test(line);
}

function isThematicBreak(line: string): boolean {
  const t = line.trim();
  if (!/^[*_\-]{3,}$/.test(t.replace(/\s/g, ""))) return false;
  // must be all same char with optional spaces
  const chars = t.replace(/\s/g, "");
  if (!/^(.)\1{2,}$/.test(chars)) return false;
  // ensure at least 3 marker chars
  return chars.length >= 3;
}

function countIndent(line: string): number {
  let n = 0;
  for (const ch of line) {
    if (ch === " ") n++;
    else if (ch === "\t") n += 4;
    else break;
  }
  return n;
}

// ---------- inline parsing ----------

// Decode common HTML entities
const ENTITY_MAP: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00A0",
  copy: "©", reg: "®", trade: "™", hellip: "…", mdash: "—", ndash: "–",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
};

function decodeEntity(s: string): string {
  if (s.startsWith("&#")) {
    const hex = s.startsWith("&#x") || s.startsWith("&#X");
    const num = hex ? parseInt(s.slice(3), 16) : parseInt(s.slice(2), 10);
    if (isNaN(num)) return s;
    try { return String.fromCodePoint(num); } catch { return s; }
  }
  const name = s.slice(1, -1);
  if (Object.prototype.hasOwnProperty.call(HTML5_ENTITIES, name)) return HTML5_ENTITIES[name]!;
  if (Object.prototype.hasOwnProperty.call(ENTITY_MAP, name)) return ENTITY_MAP[name]!;
  return s;
}

// Inline parser: returns list of InlineNode
export function parseInlines(text: string, opts: Required<ParseOptions> = DEFAULT_OPTS, refs: Map<string, LinkReference> = new Map()): InlineNode[] {
  const out: InlineNode[] = [];
  let i = 0;
  const n = text.length;
  let buf = "";

  const flushBuf = () => {
    if (buf.length > 0) {
      // decode entities in text
      out.push({ type: "text", value: decodeEntities(buf) });
      buf = "";
    }
  };

  // helper to parse emphasis recursively on a substring
  // We handle emphasis via delimiter runs below.

  while (i < n) {
    const ch = text[i];

    // backslash escape
    if (ch === "\\" && i + 1 < n) {
      const next = text[i + 1];
      if (/[!\"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]/.test(next!)) {
        buf += next!;
        i += 2;
        continue;
      }
    }

    // code span
    if (ch === "`") {
      // count backticks
      let j = i;
      while (j < n && text[j] === "`") j++;
      const ticks = j - i;
      // find closing
      const closeSeq = "`".repeat(ticks);
      let k = text.indexOf(closeSeq, j);
      // ensure not part of longer run: find exact run length
      while (k !== -1) {
        // check char after close run isn't backtick
        const after = k + ticks;
        if (after >= n || text[after] !== "`") break;
        k = text.indexOf(closeSeq, k + 1);
      }
      if (k !== -1) {
        flushBuf();
        let code = text.slice(j, k);
        // strip one leading/trailing space if both present and code has non-space
        if (code.length >= 2 && code.startsWith(" ") && code.endsWith(" ") && /\S/.test(code)) {
          code = code.slice(1, -1);
        }
        out.push({ type: "code", value: code });
        i = k + ticks;
        continue;
      }
      // no close: treat backticks as text
      buf += ch;
      i++;
      continue;
    }

    // autolink <...>
    if (ch === "<") {
      // email or url
      const m = text.slice(i).match(/^<([a-zA-Z][a-zA-Z0-9+.\-]*:[^\s<>]+)>/);
      if (m) {
        flushBuf();
        out.push({ type: "autolink", href: m[1]!, isEmail: false });
        i += m[0]!.length;
        continue;
      }
      const m2 = text.slice(i).match(/^<([^\s<>]+@[^\s<>]+)>/);
      if (m2) {
        flushBuf();
        out.push({ type: "autolink", href: "mailto:" + m2[1], isEmail: true });
        // store display? we'll render href; display text separately? autolink node has no text; renderer uses href without mailto? We'll handle in render: show email
        // store original in href? Use a marker: keep href as mailto but renderer displays email. We'll adjust: store display in a field? Let's store href as the email for display and mark isEmail.
        // Actually set href to email for display purposes? Links need href. We'll render autolink: if isEmail show text=email, href=mailto:email. Need email value. Derive from href by stripping mailto:.
        i += m2[0].length;
        continue;
      }
      // raw html tag
      const htmlMatch = text.slice(i).match(/^<\/?[a-zA-Z][a-zA-Z0-9\-]*(?:\s[^>]*)?>/);
      if (htmlMatch) {
        flushBuf();
        out.push({ type: "rawHtml", value: htmlMatch[0] });
        i += htmlMatch[0].length;
        continue;
      }
    }

    // image ![alt](url "title") or reference
    if (ch === "!" && text[i + 1] === "[") {
      const res = parseLinkOrImage(text, i + 1, true, refs);
      if (res) {
        flushBuf();
        out.push(res.node as InlineNode);
        i = res.end;
        continue;
      }
    }

    // link [text](url) or reference
    if (ch === "[") {
      // footnote ref [^id]
      if (opts.footnotes && text[i + 1] === "^") {
        const m = text.slice(i).match(/^\[\^([^\]\s]+)\]/);
        if (m) {
          flushBuf();
          out.push({ type: "footnoteRef", id: m[1]! });
          i += m[0]!.length;
          continue;
        }
      }
      const res = parseLinkOrImage(text, i, false, refs);
      if (res) {
        flushBuf();
        out.push(res.node as InlineNode);
        i = res.end;
        continue;
      }
    }

    // emphasis / strong / strikethrough / extensions
    // strikethrough ~~
    if (opts.gfm && ch === "~" && text[i + 1] === "~") {
      const res = parseDelimited(text, i, "~~", (inner) => ({ type: "strikethrough", children: parseInlines(inner, opts, refs) }));
      if (res) { flushBuf(); out.push(res.node); i = res.end; continue; }
    }
    // highlight == (extension)
    if (opts.extensions && ch === "=" && text[i + 1] === "=") {
      const res = parseDelimited(text, i, "==", (inner) => ({ type: "highlight", children: parseInlines(inner, opts, refs) }));
      if (res) { flushBuf(); out.push(res.node); i = res.end; continue; }
    }
    // superscript ^ (extension)
    if (opts.extensions && ch === "^") {
      const res = parseDelimited(text, i, "^", (inner) => ({ type: "superscript", children: parseInlines(inner, opts, refs) }), true);
      if (res) { flushBuf(); out.push(res.node); i = res.end; continue; }
    }
    // subscript ~ (extension) — single ~ not ~~
    if (opts.extensions && ch === "~" && text[i + 1] !== "~") {
      const res = parseDelimited(text, i, "~", (inner) => ({ type: "subscript", children: parseInlines(inner, opts, refs) }), true);
      if (res) { flushBuf(); out.push(res.node); i = res.end; continue; }
    }

    // emphasis * or _
    if (ch === "*" || ch === "_") {
      // determine run length
      let runLen = 0;
      while (i + runLen < n && text[i + runLen] === ch) runLen++;
      // flanking checks
      const prev = i > 0 ? text[i - 1]! : "";
      const next = i + runLen < n ? text[i + runLen]! : "";
      const isWhitespace = (c: string) => c === "" || /\\s/.test(c);
      const isPunct = (c: string) => c !== "" && !/\\s/.test(c) && !/[A-Za-z0-9]/.test(c);
      const leftFlanking = !isWhitespace(next) && (isPunct(next) === false || isWhitespace(prev) || isPunct(prev));
      // for _ : opening requires preceded by whitespace/punctuation/start (not word char)
      const canOpen = ch === "*"
        ? leftFlanking
        : leftFlanking && (prev === "" || isWhitespace(prev) || isPunct(prev));
      if (!canOpen) {
        // not an opener; fall through (treat as text)
        buf += ch;
        i++;
        continue;
      }
      // try triple (strong+emphasis) first
      if (runLen >= 3) {
        const delim = ch.repeat(3);
        const res = parseDelimited(text, i, delim, (inner) => ({ type: "strong", children: [ { type: "emphasis", children: parseInlines(inner, opts, refs) } ] }));
        if (res) { flushBuf(); out.push(res.node); i = res.end; continue; }
      }
      // try strong (** or __) then emphasis
      if (runLen >= 2) {
        const delim = ch.repeat(2);
        const res = parseDelimited(text, i, delim, (inner) => ({ type: "strong", children: parseInlines(inner, opts, refs) }));
        if (res) { flushBuf(); out.push(res.node); i = res.end; continue; }
      }
      if (runLen >= 1) {
        const res = parseDelimited(text, i, ch, (inner) => ({ type: "emphasis", children: parseInlines(inner, opts, refs) }));
        if (res) { flushBuf(); out.push(res.node); i = res.end; continue; }
      }
    }

    // hard line break: two trailing spaces or backslash at end
    if (ch === "\\" && i + 1 < n && text[i + 1] === "\n") {
      flushBuf();
      out.push({ type: "hardbreak" });
      i += 2;
      // consume the newline
      if (i < n && text[i] === "\n") i++;
      continue;
    }

    // GFM bare autolink (URL)
    if (opts.gfm) {
      const autoUrl = text.slice(i).match(/^(https?:\/\/[^\s<]+[^\s<.,:;!?)])(?=[\s)]|$)/);
      if (autoUrl && autoUrl[1]) {
        flushBuf();
        out.push({ type: "autolink", href: autoUrl[1], isEmail: false });
        i += autoUrl[1].length;
        continue;
      }
      const autoEmail = text.slice(i).match(/^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (autoEmail && autoEmail[1]) {
        flushBuf();
        out.push({ type: "autolink", href: "mailto:" + autoEmail[1], isEmail: true });
        i += autoEmail[1].length;
        continue;
      }
    }

    // entity reference
    if (ch === "&") {
      const m = text.slice(i).match(/^&(?:#[0-9]+|#[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/);
      if (m) {
        flushBuf();
        out.push({ type: "text", value: decodeEntity(m[0]!) });
        i += m[0]!.length;
        continue;
      }
    }

    // newline handling (softbreak)
    if (ch === "\n") {
      // collapse: if previous ended with 2 spaces -> hardbreak already handled above? We handle two-space hardbreak separately.
      // Check two spaces before newline
      if (buf.endsWith("  ") || buf.endsWith("\t")) {
        buf = buf.replace(/\s+$/, "");
        flushBuf();
        out.push({ type: "hardbreak" });
      } else {
        flushBuf();
        out.push({ type: "softbreak" });
      }
      i++;
      continue;
    }

    buf += ch;
    i++;
  }

  flushBuf();
  // merge adjacent text nodes
  return mergeText(out);
}

function mergeText(nodes: InlineNode[]): InlineNode[] {
  const out: InlineNode[] = [];
  for (const n of nodes) {
    const last = out[out.length - 1];
    if (n.type === "text" && last && last.type === "text") {
      last.value += n.value;
    } else {
      out.push(n);
    }
  }
  return out;
}

function decodeEntities(s: string): string {
  return s.replace(/&(?:#[0-9]+|#[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (m) => decodeEntity(m));
}

// parse delimited inline: delim string, returns node if closing found on same "scope"
function parseDelimited(
  text: string,
  start: number,
  delim: string,
  build: (inner: string) => InlineNode,
  singleCharNoNest = false
): { node: InlineNode; end: number } | null {
  const n = text.length;
  // opening delim at start
  if (!text.startsWith(delim, start)) return null;
  // find closing
  let i = start + delim.length;
  // skip if space after opening
  if (i < n && /\s/.test(text[i]!)) return null;
  // search
  let depth = 0;
  while (i < n) {
    if (text.startsWith(delim, i)) {
      // ensure not preceded by space
      if (i > start + delim.length && /\s/.test(text[i - 1]!)) {
        i++;
        continue;
      }
      // right-flanking check for closing
      const ch = delim[0];
      const afterClose = i + delim.length < n ? text[i + delim.length]! : "";
      const isWs = (c: string) => c === "" || /\s/.test(c);
      const isPunct = (c: string) => c !== "" && !/\s/.test(c) && !/[A-Za-z0-9]/.test(c);
      const rightFlanking = !isWs(text[i - 1]!) && (isPunct(text[i - 1]!) === false || isWs(afterClose) || isPunct(afterClose));
      const canClose = ch === "*"
        ? rightFlanking
        : rightFlanking && (afterClose === "" || isWs(afterClose) || isPunct(afterClose));
      if (!canClose) {
        i++;
        continue;
      }
      const inner = text.slice(start + delim.length, i);
      if (inner.length === 0) return null;
      // no newlines inside for single-line delimiters? allow
      return { node: build(inner), end: i + delim.length };
    }
    // skip escaped
    if (text[i] === "\\") { i += 2; continue; }
    i++;
  }
  return null;
}

function parseLinkOrImage(
  text: string,
  start: number,
  isImage: boolean,
  refs: Map<string, LinkReference>
): { node: InlineNode; end: number } | null {
  // start at '[' (or already past ! for image? We pass index of '[')
  // parse bracketed text
  const bracket = matchBalanced(text, start, "[", "]");
  if (!bracket) return null;
  const label = text.slice(start + 1, bracket.close);
  const after = bracket.close + 1;
  const n = text.length;

  // inline link/image (...)
  if (after < n && text[after] === "(") {
    const paren = matchBalancedParen(text, after);
    if (!paren) return null;
    const content = text.slice(after + 1, paren.close).trim();
    // split url and title
    const { url, title } = parseLinkDestination(content);
    const children = parseInlines(label, DEFAULT_OPTS, refs);
    const node: InlineNode = isImage
      ? (title !== undefined ? { type: "image", src: url, alt: label, title } : { type: "image", src: url, alt: label })
      : (title !== undefined ? { type: "link", href: url, title, children } : { type: "link", href: url, children });
    return { node, end: paren.close + 1 };
  }

  // reference link [label][ref] or [label]
  // check for [ref]
  let refLabel = label;
  let idx = after;
  if (idx < n && text[idx] === "[") {
    const r2 = matchBalanced(text, idx, "[", "]");
    if (!r2) return null;
    refLabel = text.slice(idx + 1, r2.close);
    idx = r2.close + 1;
  } else {
    // shortcut reference: only if no ( follows; idx stays after first bracket
    idx = after;
  }
  // lookup ref
  const key = refLabel.trim().toLowerCase().replace(/\s+/g, " ");
  const ref = refs.get(key);
  if (!ref) {
    // could be a link ref definition not yet... try case-insensitive search already in map
    return null;
  }
  const children = parseInlines(label, DEFAULT_OPTS, refs);
  const node: InlineNode = isImage
    ? (ref.title !== undefined ? { type: "image", src: ref.url, alt: label, title: ref.title } : { type: "image", src: ref.url, alt: label })
    : (ref.title !== undefined ? { type: "link", href: ref.url, title: ref.title, children } : { type: "link", href: ref.url, children });
  return { node, end: idx };
}

function matchBalanced(text: string, start: number, open: string, close: string): { close: number } | null {
  if (text[start] !== open) return null;
  let depth = 0;
  let i = start;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\") { i += 2; continue; }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return { close: i };
    }
    // skip code spans? simplified
    i++;
  }
  return null;
}

function matchBalancedParen(text: string, start: number): { close: number } | null {
  if (text[start] !== "(") return null;
  let depth = 0;
  let i = start;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\") { i += 2; continue; }
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) return { close: i };
    }
    i++;
  }
  return null;
}

function parseLinkDestination(content: string): { url: string; title?: string } {
  content = content.trim();
  // title in quotes or parens
  let url = content;
  let title: string | undefined;
  // handle angle-bracketed url
  if (content.startsWith("<")) {
    const end = content.indexOf(">");
    if (end !== -1) {
      url = content.slice(1, end);
      const rest = content.slice(end + 1).trim();
      if (rest) title = stripQuotes(rest);
      return title !== undefined ? { url, title } : { url };
    }
  }
  // split by whitespace for title
  const m = content.match(/^(\S+)(?:\s+(.+))?$/);
  if (m) {
    url = m[1]!;
    if (m[2]!) title = stripQuotes(m[2]!.trim());
  }
  return title !== undefined ? { url, title } : { url };
}

function stripQuotes(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  if (s.startsWith("(") && s.endsWith(")")) return s.slice(1, -1);
  return s;
}

// ---------- block parsing ----------

export function parseBlocks(src: string, opts: ParseOptions = {}): TextDocument {
  const o = { ...DEFAULT_OPTS, ...opts };
  const lines = splitLines(src);
  const refs = new Map<string, LinkReference>();
  // First pass: collect link reference definitions
  collectRefs(lines, refs);
  const children = parseBlockList(lines, o, refs, 0, lines.length);
  return { type: "document", children };
}

function collectRefs(lines: string[], refs: Map<string, LinkReference>) {
  const re = /^\[([^\]]+)\]:\s*(\S+)(?:\s+(.+))?$/;
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      const label = m[1]!.trim().toLowerCase().replace(/\s+/g, " ");
      const t = m[3]! ? stripQuotes(m[3]!.trim()) : undefined;
      if (t !== undefined) refs.set(label, { label: m[1]!, url: m[2]!, title: t });
      else refs.set(label, { label: m[1]!, url: m[2]! });
    }
  }
}

function parseBlockList(lines: string[], opts: Required<ParseOptions>, refs: Map<string, LinkReference>, start: number, end: number): BlockNode[] {
  const blocks: BlockNode[] = [];
  let i = start;
  while (i < end) {
    if (isBlank(lines[i]!)) { i++; continue; }

    // thematic break
    if (isThematicBreak(lines[i]!)) {
      blocks.push({ type: "thematicBreak" });
      i++;
      continue;
    }

    // ATX heading
    const atx = lines[i]!.match(/^(#{1,6})(?:[ \t]+|$)(.*)$/);
    if (atx) {
      const hashes = atx[1]!;
      const rest = atx[2]!;
      const level = hashes.length;
      const content = rest.trim().replace(/\s+#+\s*$/, ""); // strip trailing hashes
      blocks.push({ type: "heading", level, children: parseInlines(content, opts, refs) });
      i++;
      continue;
    }

    // fenced code block
    const fence = lines[i]!.match(/^(`{3,}|~{3,})(.*)$/);
    if (fence) {
      const marker = fence[1]!;
      const info = fence[2]!;
      const lang = (info.trim().split(/\s+/)[0]) || "";
      const char = marker[0];
      const minLen = marker.length;
      i++;
      const codeLines: string[] = [];
      while (i < end) {
        const closeMatch = lines[i]!.match(/^(`{3,}|~{3,})\s*$/);
        if (closeMatch && closeMatch[1]![0] === char && closeMatch[1]!.length >= minLen) {
          i++;
          break;
        }
        codeLines.push(lines[i]!);
        i++;
        if (i >= end) break;
      }
      const fencedValue = codeLines.length > 0 ? codeLines.join("\n") + "\n" : ""; blocks.push({ type: "codeBlock", language: lang, value: fencedValue, fenced: true });
      continue;
    }

    // setext heading (check before paragraph)
    if (i + 1 < end && !isBlank(lines[i]!) && !isBlank(lines[i + 1]!) && !isBlockStart(lines[i]!) && (/^=+\s*$/.test(lines[i + 1]!.trim()) || /^-+\s*$/.test(lines[i + 1]!.trim()))) {
      const level = /^=/.test(lines[i + 1]!.trim()) ? 1 : 2;
      // ensure underline not thematic-ish; require at least one =/-
      blocks.push({ type: "heading", level, children: parseInlines(lines[i]!.trim(), opts, refs) });
      i += 2;
      continue;
    }

    // blockquote
    if (/^ {0,3}>/.test(lines[i]!)) {
      // collect lines belonging to blockquote
      const bqLines: string[] = [];
      while (i < end && (/^ {0,3}>/.test(lines[i]!) || (bqLines.length > 0 && !isBlank(lines[i]!) && countIndent(lines[i]!) >= 0 && !isBlockStart(lines[i]!)))) {
        // simpler: collect consecutive > lines and continuation lines
        if (/^ {0,3}>/.test(lines[i]!)) {
          bqLines.push(lines[i]!.replace(/^ {0,3}> ?/, ""));
          i++;
        } else if (!isBlank(lines[i]!) && bqLines.length > 0 && !isBlockStart(lines[i]!) && bqLines[bqLines.length - 1]!.trim() !== "") {
          // lazy continuation
          bqLines.push(lines[i]!);
          i++;
        } else {
          break;
        }
      }
      const inner = parseBlockList(bqLines, opts, refs, 0, bqLines.length);
      // callout detection
      if (opts.callouts && inner.length > 0 && inner[0]!.type === "paragraph") {
        const firstText = inlineToText(inner[0]!.children);
        const cm = firstText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i);
        if (cm) {
          const kind = cm[1]!.toLowerCase();
          // remove the marker from paragraph
          // rebuild paragraph children without marker
          const newChildren = stripCalloutMarker(inner[0]!.children);
          const rest = newChildren.length > 0 ? [{ ...inner[0]!, children: newChildren } as BlockNode] : [];
          const children = [...rest, ...inner.slice(1)];
          blocks.push({ type: "callout", kind, children });
          continue;
        }
      }
      blocks.push({ type: "blockquote", children: inner });
      continue;
    }

    // list
    const listMatch = lines[i]!.match(/^ {0,3}([-+*]|\d{1,9}[.)])[ \t]/);
    if (listMatch) {
      const { items, newI } = parseList(lines, opts, refs, i, end);
      blocks.push(items);
      i = newI;
      continue;
    }

    // GFM table
    if (opts.gfm && i + 1 < end && isTableHeader(lines[i]!) && isTableDelimiter(lines[i + 1]!)) {
      const { table, newI } = parseTable(lines, opts, refs, i, end);
      blocks.push(table);
      i = newI;
      continue;
    }

    // html block (simplified): starts with block-level tag
    if (/^ {0,3}<!--/.test(lines[i]!) || /^ {0,3}<\?/.test(lines[i]!) || /^ {0,3}<!\[CDATA\[/.test(lines[i]!) || /^ {0,3}<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s|>|\/)/i.test(lines[i]!)) {
      const htmlLines: string[] = [];
      while (i < end && !isBlank(lines[i]!)) {
        htmlLines.push(lines[i]!);
        i++;
      }
      blocks.push({ type: "htmlBlock", value: htmlLines.join("\n") });
      continue;
    }

    // indented code block (4 spaces) — only if not in paragraph context
    if (/^ {4}/.test(lines[i]!) && !isBlank(lines[i]!)) {
      const codeLines: string[] = [];
      while (i < end && (/^ {4}/.test(lines[i]!) || isBlank(lines[i]!))) {
        if (isBlank(lines[i]!)) { codeLines.push(""); i++; continue; }
        codeLines.push(lines[i]!.replace(/^ {4}/, ""));
        i++;
      }
      // trim trailing blanks
      while (codeLines.length > 0 && codeLines[codeLines.length - 1] === "") codeLines.pop();
      const indentedValue = codeLines.length > 0 ? codeLines.join("\n") + "\n" : ""; blocks.push({ type: "codeBlock", language: "", value: indentedValue, fenced: false });
      continue;
    }

    // footnote definition [^id]:
    if (opts.footnotes) {
      const fm = lines[i]!.match(/^\[\^([^\]]+)\]:\s*(.*)$/);
      if (fm) {
        const id = fm[1]!;
        const rest = fm[2] ?? "";
        const contentLines = [rest];
        i++;
        // collect indented continuation
        while (i < end && (countIndent(lines[i]!) >= 4 || (lines[i]!.trim() !== "" && countIndent(lines[i]!) >= 1 && !isBlockStart(lines[i]!)))) {
          if (isBlank(lines[i]!)) { contentLines.push(""); i++; continue; }
          contentLines.push(lines[i]!.replace(/^ {1,4}/, ""));
          i++;
        }
        const inner = parseBlockList(contentLines, opts, refs, 0, contentLines.length);
        blocks.push({ type: "footnoteDef", id, children: inner.length ? inner : [{ type: "paragraph", children: parseInlines(rest, opts, refs) }] });
        continue;
      }
    }

    // link reference definition (skip, already collected)
    if (/^\[[^\]]+\]:\s*\S/.test(lines[i]!)) {
      i++;
      continue;
    }

    // paragraph (default)
    const paraLines: string[] = [];
    while (i < end && !isBlank(lines[i]!) && !isBlockStart(lines[i]!)) {
      paraLines.push(lines[i]!);
      i++;
    }
    // join with soft break (space for markdown paragraphs, but preserve hard breaks)
    if (paraLines.length === 0) { i++; continue; }
    const paraText = paraLines.join("\n");
    blocks.push({ type: "paragraph", children: parseInlines(paraText, opts, refs) });
  }
  return blocks;
}

function isBlockStart(line: string): boolean {
  if (isBlank(line)) return true;
  if (isThematicBreak(line)) return true;
  if (/^#{1,6}(?:\s|$)/.test(line)) return true;
  if (/^(`{3,}|~{3,})/.test(line)) return true;
  if (/^ {0,3}>/.test(line)) return true;
  if (/^ {0,3}([-+*]|\d{1,9}[.)])\s/.test(line)) return true;
  if (/^ {0,3}<!--/.test(line) || /^ {0,3}<\?/.test(line) || /^ {0,3}<!\[CDATA\[/.test(line) || /^ {0,3}<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s|>|\/)/i.test(line)) return true;
  return false;
}

// ---------- list parsing ----------

function parseList(lines: string[], opts: Required<ParseOptions>, refs: Map<string, LinkReference>, start: number, end: number): { items: BlockNode; newI: number } {
  const firstMatch = lines[start]!.match(/^ {0,3}([-+*]|\d{1,9}[.)])[ \t]/)!;
  const marker = firstMatch[1]!;
  const ordered = /\d/.test(marker);
  const startNum = ordered ? parseInt(marker, 10) : 1;
  const bulletChar = ordered ? null : marker;
  const items: any[] = [];
  let i = start;
  let tight = true;
  let hasInternalBlank = false;
  let sawBlankBetween = false;
  // We'll collect items: each item starts with marker; content may span multiple lines indented.
  const itemStarts: number[] = [];
  while (i < end) {
    if (isBlank(lines[i]!)) {
      if (i + 1 < end) {
        const nm = lines[i + 1]!.match(/^ {0,3}([-+*]|\d{1,9}[.)])[ \t]/);
        if (nm) {
          const nMarker = nm[1]!;
          const nOrdered = /\d/.test(nMarker);
          if (nOrdered === ordered && (ordered || nMarker === bulletChar)) {
            sawBlankBetween = true;
            i++;
            continue;
          }
        }
      }
      break;
    }
    const m = lines[i]!.match(/^ {0,3}([-+*]|\d{1,9}[.)])[ \t]/);
    if (!m) break;
    // same list type?
    const mMarker = m[1]!;
    const mOrdered = /\d/.test(mMarker);
    if (mOrdered !== ordered) break;
    if (!ordered && mMarker !== bulletChar) break;
    itemStarts.push(i);
    i++;
    // skip continuation lines (indented or blank within item)
    while (i < end) {
      if (isBlank(lines[i]!)) {
        // blank line could end item or separate items; peek
        if (i + 1 < end && /^ {0,3}([-+*]|\d{1,9}[.)])\s/.test(lines[i + 1]!)) break;
        // if next non-blank is indented, continue
        // collect blank
        i++;
        // if eof or next is block start at base, stop
        if (i >= end) break;
        if (!isBlank(lines[i]!) && countIndent(lines[i]!) < 2 && !/^ {0,3}([-+*]|\d{1,9}[.)])\s/.test(lines[i]!)) {
          // end of list
          break;
        }
        continue;
      }
      if (countIndent(lines[i]!) >= 2) { i++; continue; }
      if (/^ {0,3}([-+*]|\d{1,9}[.)])\s/.test(lines[i]!)) break;
      // end
      break;
    }
  }
  // Detect blank lines between items -> loose list (already tracked during collection)
  for (let k = 0; k + 1 < itemStarts.length; k++) {
    for (let j = itemStarts[k]! + 1; j < itemStarts[k + 1]!; j++) {
      if (isBlank(lines[j]!)) { sawBlankBetween = true; break; }
    }
    if (sawBlankBetween) break;
  }

  // Now parse each item's lines
  for (let k = 0; k < itemStarts.length; k++) {
    const s = itemStarts[k]!;
    const e = k + 1 < itemStarts.length ? itemStarts[k + 1]! : i;
    // gather lines for this item
    const itemLines: string[] = [];
    // first line: strip marker
    const firstLine = lines[s]!.replace(/^ {0,3}([-+*]|\d{1,9}[.)])[ \t]{1,4}/, "");
    itemLines.push(firstLine);
    for (let j = s + 1; j < e; j++) {
      if (isBlank(lines[j]!)) { itemLines.push(""); continue; }
      // strip up to 4 spaces indent
      itemLines.push(lines[j]!.replace(/^ {0,4}/, ""));
    }
    // trim trailing blank lines (do not count as internal blank)
    while (itemLines.length > 1 && itemLines[itemLines.length - 1] === "") itemLines.pop();
    if (itemLines.some(l => l === "")) hasInternalBlank = true;
    // task list check
    let checked: boolean | null = null;
    let contentLines = itemLines;
    const taskMatch = (itemLines[0] || "").match(/^\[([ xX])\]\s+(.*)$/);
    if (taskMatch) {
      checked = taskMatch[1]!.toLowerCase() === "x";
      itemLines[0] = taskMatch[2]!;
    }
    const inner = parseBlockList(itemLines, opts, refs, 0, itemLines.length);
    items.push({ type: "listItem", children: inner.length ? inner : [{ type: "paragraph", children: parseInlines(itemLines.join("\n"), opts, refs) }], checked });
  }
  tight = !(sawBlankBetween || hasInternalBlank);
  const listNode: BlockNode = {
    type: "list",
    ordered,
    start: startNum,
    tight,
    children: items,
  } as any;
  return { items: listNode, newI: i };
}

// ---------- table parsing ----------

function isTableHeader(line: string): boolean {
  return line.includes("|");
}
function isTableDelimiter(line: string): boolean {
  const t = line.trim();
  if (!t.includes("|")) return false;
  const cells = t.split("|").map(c => c.trim()).filter((_, idx, arr) => !(idx === 0 && arr[0] === "") && !(idx === arr.length - 1 && arr[arr.length - 1] === ""));
  if (cells.length === 0) return false;
  return cells.every(c => /^:?-{3,}:?$/.test(c));
}

function parseTable(lines: string[], opts: Required<ParseOptions>, refs: Map<string, LinkReference>, start: number, end: number): { table: BlockNode; newI: number } {
  const headerLine = lines[start]!;
  const delimLine = lines[start + 1]!;
  const align = delimLine.split("|").map(c => c.trim()).filter((_, idx, arr) => !(idx === 0 && arr[0] === "") && !(idx === arr.length - 1 && arr[arr.length - 1] === "")).map(c => {
    const left = c.startsWith(":");
    const right = c.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    if (left) return "left";
    return null;
  });

  function splitRow(line: string): string[] {
    let s = line.trim();
    if (s.startsWith("|")) s = s.slice(1);
    if (s.endsWith("|")) s = s.slice(0, -1);
    return s.split("|").map(c => c.trim());
  }

  const header = splitRow(headerLine).map(cell => parseInlines(cell, opts, refs));
  const rows: InlineNode[][][] = [];
  let i = start + 2;
  while (i < end && lines[i]!.trim() !== "" && lines[i]!.includes("|")) {
    rows.push(splitRow(lines[i]!).map(cell => parseInlines(cell, opts, refs)));
    i++;
  }
  const table: BlockNode = { type: "table", header, rows, align };
  return { table, newI: i };
}

// ---------- helpers ----------

function inlineToText(nodes: InlineNode[]): string {
  let s = "";
  for (const n of nodes) {
    switch (n.type) {
      case "text": s += n.value; break;
      case "code": s += n.value; break;
      case "softbreak": s += " "; break;
      case "hardbreak": s += " "; break;
      default: if ("children" in n && Array.isArray((n as any).children)) s += inlineToText((n as any).children); break;
    }
  }
  return s;
}

function stripCalloutMarker(nodes: InlineNode[]): InlineNode[] {
  // remove leading text node portion "[!NOTE]" etc.
  const out = [...nodes];
  if (out.length === 0) return out;
  const first = out[0]!;
  if (first.type === "text") {
    const m = first.value.match(/^\[![A-Z]+\]\s*/i);
    if (m) {
      const rest = first.value.slice(m[0]!.length);
      if (rest) out[0] = { type: "text", value: rest };
      else out.shift();
    }
  }
  return out;
}

export function parseMarkdown(src: string, opts: ParseOptions = {}): TextDocument {
  const o = { ...DEFAULT_OPTS, ...opts };
  return parseBlocks(src, o);
}
