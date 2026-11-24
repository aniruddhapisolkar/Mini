// MiniRender — Text Processing Utilities
// Phase 1: Shared text processing, sanitization, and typography

// ─── HTML sanitization ──────────────────────────────────────────

const DANGEROUS_TAGS = new Set([
  "script",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "textarea",
  "select",
]);

const DANGEROUS_ATTRS = new Set([
  "onload",
  "onerror",
  "onclick",
  "onmouseover",
  "onfocus",
  "onblur",
  "onchange",
  "onsubmit",
  "onkeydown",
  "onkeyup",
]);

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization: remove dangerous tags and attributes
  // This is a minimal implementation for Phase 1; will be enhanced
  let result = html;

  // Remove dangerous tags (and their content for script)
  for (const tag of DANGEROUS_TAGS) {
    const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, "gi");
    result = result.replace(regex, "");
    // Also remove self-closing
    const selfClosing = new RegExp(`<${tag}[^>]*/?>`, "gi");
    result = result.replace(selfClosing, "");
  }

  // Remove dangerous attributes
  for (const attr of DANGEROUS_ATTRS) {
    const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, "gi");
    result = result.replace(regex, "");
  }

  // Filter javascript: URLs
  result = result.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');

  return result;
}

// ─── Text processor ─────────────────────────────────────────────

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function unescapeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function decodeEntities(text: string): string {
  // Basic entity decoding
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&nbsp;": "\u00A0",
  };
  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, "g"), char);
  }
  return result;
}

// ─── Typography ─────────────────────────────────────────────────

export interface TypographyOptions {
  smartQuotes?: boolean;
  smartDashes?: boolean;
  ellipsis?: boolean;
}

export function applyTypography(text: string, options: TypographyOptions = {}): string {
  let result = text;

  if (options.smartQuotes) {
    // Simple smart quote replacement
    result = result.replace(/"([^"]*)"/g, "\u201C$1\u201D");
    result = result.replace(/'([^']*)'/g, "\u2018$1\u2019");
  }

  if (options.smartDashes) {
    result = result.replace(/---/g, "\u2014"); // em dash
    result = result.replace(/--/g, "\u2013"); // en dash
  }

  if (options.ellipsis) {
    result = result.replace(/\.\.\./g, "\u2026");
  }

  return result;
}

// ─── Text measurement fallback ──────────────────────────────────

export function estimateTextWidth(text: string, fontSize: number): number {
  // Rough estimation: average char width ~0.5 * fontSize for proportional fonts
  return text.length * fontSize * 0.5;
}

export function estimateLineHeight(fontSize: number, lineHeight: number = 1.2): number {
  return fontSize * lineHeight;
}
