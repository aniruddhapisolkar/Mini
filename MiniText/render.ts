// MiniText — HTML renderer (sanitized)

import type { BlockNode, InlineNode, TextDocument } from "./types.js";
import { sanitizeHtml, Typography, TextProcessor } from "../MiniRender/text/index.js";
import { tokenize } from "../MiniCode/tokenizer.js";
import { getTheme } from "../MiniCode/themes.js";
const escapeHtml = TextProcessor.escapeHtml;

export interface RenderOptions {
  sanitize?: boolean;
  typography?: boolean;
  gfm?: boolean;
}

export function renderBlocks(blocks: BlockNode[], opts: RenderOptions = {}): string {
  const sanitize = opts.sanitize !== false;
  const typo = opts.typography === true;
  return blocks.map(b => renderBlock(b, opts, sanitize, typo)).join("\n");
}

export function renderDocument(doc: TextDocument, opts: RenderOptions = {}): string {
  return renderBlocks(doc.children, opts);
}

function renderBlock(b: BlockNode, opts: RenderOptions, sanitize: boolean, typo: boolean): string {
  switch (b.type) {
    case "document":
      return renderBlocks(b.children, opts);
    case "paragraph":
      return `<p class="mini-text-p">${renderInlines(b.children, typo)}</p>`;
    case "heading": {
      const id = b.id ? ` id="${escapeHtml(b.id)}"` : "";
      return `<h${b.level}${id} class="mini-text-h${b.level}">${renderInlines(b.children, typo)}</h${b.level}>`;
    }
    case "thematicBreak":
      return `<hr class="mini-text-hr" />`;
    case "codeBlock": {
      const lang = b.language || "";
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      if (!lang) {
        return `<pre class="mini-text-pre"><code${cls}>${escapeHtml(b.value)}</code></pre>`;
      }
      const theme = getTheme("github-light");
      let highlighted = "";
      try {
        const toks = tokenize(b.value, lang);
        for (const t of toks) {
          if (t.text === "\\n") { highlighted += "\\n"; continue; }
          const color = (theme.colors as any)[t.scope] || theme.foreground;
          highlighted += `<span style="color:${color}">${escapeHtml(t.text)}</span>`;
        }
      } catch {
        highlighted = escapeHtml(b.value);
      }
      return `<pre class="mini-text-pre"><code${cls}>${highlighted}</code></pre>`;
    }
    case "htmlBlock":
      return sanitize ? sanitizeHtml(b.value) : b.value;
    case "blockquote":
      return `<blockquote class="mini-text-bq">${renderBlocks(b.children, opts)}</blockquote>`;
    case "list": {
      const tag = b.ordered ? "ol" : "ul";
      const start = b.ordered && b.start !== 1 ? ` start="${b.start}"` : "";
      const tight = (b as any).tight !== false;
      const items = b.children.map(li => renderListItem(li, opts, sanitize, typo, tight)).join("");
      return `<${tag}${start} class="mini-text-list">${items}</${tag}>`;
    }
    case "listItem": {
      const checked = b.checked;
      let cb = "";
      if (checked !== null && checked !== undefined) {
        cb = `<input type="checkbox" ${checked ? "checked" : ""} disabled /> `;
      }
      return `<li class="mini-text-li">${cb}${renderBlocks(b.children, opts)}</li>`;
    }
    case "table": {
      const alignStyle = (a: string | null) => (a ? ` style="text-align:${a}"` : "");
      const headCells = (b.header || []).map((cell, idx) => `<th${alignStyle(b.align[idx] ?? null)}>${renderInlines(cell, typo)}</th>`).join("");
      const head = `<thead><tr>${headCells}</tr></thead>`;
      const bodyRows = b.rows.map(row => {
        const cells = row.map((cell, idx) => `<td${alignStyle(b.align[idx] ?? null)}>${renderInlines(cell, typo)}</td>`).join("");
        return `<tr>${cells}</tr>`;
      }).join("");
      const body = `<tbody>${bodyRows}</tbody>`;
      return `<table class="mini-text-table">${head}${body}</table>`;
    }
    case "footnoteDef":
      return `<div class="mini-text-footnote" id="fn-${escapeHtml(b.id)}"><sup>${escapeHtml(b.id)}</sup> ${renderBlocks(b.children, opts)}</div>`;
    case "callout":
      return `<div class="mini-text-callout mini-text-callout-${escapeHtml(b.kind)}"><div class="mini-text-callout-title">${escapeHtml(b.kind)}</div>${renderBlocks(b.children, opts)}</div>`;
    case "details":
      return `<details${b.open ? " open" : ""}><summary>${escapeHtml(b.summary)}</summary>${renderBlocks(b.children, opts)}</details>`;
    default:
      return "";
  }
}

function renderListItem(li: any, opts: RenderOptions, sanitize: boolean, typo: boolean, tight: boolean = false): string {
  if (li.type !== "listItem") return "";
  const checked = li.checked;
  let cb = "";
  if (checked !== null && checked !== undefined) cb = `<input type="checkbox" ${checked ? "checked" : ""} disabled /> `;
  // Tight lists: render a single paragraph's inlines directly without <p>
  if (tight && Array.isArray(li.children) && li.children.length === 1 && li.children[0].type === "paragraph") {
    return `<li class="mini-text-li">${cb}${renderInlines(li.children[0].children, typo)}</li>`;
  }
  return `<li class="mini-text-li">${cb}${renderBlocks(li.children, opts)}</li>`;
}

function renderInlines(nodes: InlineNode[], typo: boolean): string {
  return nodes.map(n => renderInline(n, typo)).join("");
}

function renderInline(n: InlineNode, typo: boolean): string {
  switch (n.type) {
    case "text":
      return escapeHtml(typo ? Typography.apply(n.value) : n.value);
    case "softbreak":
      return "\n";
    case "hardbreak":
      return "<br />\n";
    case "code":
      return `<code class="mini-text-code">${escapeHtml(n.value)}</code>`;
    case "emphasis":
      return `<em>${renderInlines(n.children, typo)}</em>`;
    case "strong":
      return `<strong>${renderInlines(n.children, typo)}</strong>`;
    case "strikethrough":
      return `<del>${renderInlines(n.children, typo)}</del>`;
    case "link":
      return `<a href="${escapeHtml(n.href)}"${n.title ? ` title="${escapeHtml(n.title)}"` : ""}>${renderInlines(n.children, typo)}</a>`;
    case "image":
      return `<img src="${escapeHtml(n.src)}" alt="${escapeHtml(n.alt)}"${n.title ? ` title="${escapeHtml(n.title)}"` : ""} />`;
    case "autolink": {
      const display = n.isEmail ? n.href.replace(/^mailto:/, "") : n.href;
      const href = n.isEmail ? `mailto:${display}` : n.href;
      return `<a href="${escapeHtml(href)}">${escapeHtml(display)}</a>`;
    }
    case "rawHtml":
      return sanitizeHtml(n.value);
    case "superscript":
      return `<sup>${renderInlines(n.children, typo)}</sup>`;
    case "subscript":
      return `<sub>${renderInlines(n.children, typo)}</sub>`;
    case "highlight":
      return `<mark>${renderInlines(n.children, typo)}</mark>`;
    case "footnoteRef":
      return `<sup class="mini-text-fnref"><a href="#fn-${escapeHtml(n.id)}">${escapeHtml(n.label ?? n.id)}</a></sup>`;
    default:
      return "";
  }
}
