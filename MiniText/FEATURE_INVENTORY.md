# MiniText — Feature Inventory

Owner: Jimbo
References: CommonMark (spec v0.31.2), GitHub Flavored Markdown (GFM spec 0.29-gfm), established rich-text rendering systems
Status: Phase 0 research

## 1. Reference libraries pinned

- CommonMark Spec: https://spec.commonmark.org/0.31.2/ — CC BY-SA 4.0. Canonical Markdown syntax spec. Reference implementations in C and JS. Test suite (spec tests JSON). Target: full CommonMark 0.31.2 compatibility.
- GitHub Flavored Markdown Spec: https://github.github.com/gfm/ — CC BY-SA 4.0. Strict superset of CommonMark. Adds tables, task lists, strikethrough, autolinks (extension), disallowed raw HTML. Target: full GFM 0.29-gfm compatibility.
- Additional rich-text rendering systems: ProseMirror, Slate, Lexical, Quill (for structured document / editing patterns), Pandoc (for conversion fidelity), marked, remark/unified (for plugin architecture), micromark (for small, correct, extensible parser).

License note: CommonMark and GFM specs are CC BY-SA 4.0 (documentation/specs, not code). Reference implementations (cmark, commonmark.js) are BSD-2-Clause. micromark is MIT. Verify before vendoring any code. No external runtime deps targeted (zero deps).

## 2. CommonMark core (must achieve full compatibility)

### 2.1 Leaf blocks
- [ ] Thematic breaks (---, ***, ___)
- [ ] ATX headings (# ... ######)
- [ ] Setext headings (underline with = or -)
- [ ] Indented code blocks (4-space indent)
- [ ] Fenced code blocks (backticks or tildes, info string)
- [ ] HTML blocks (types 1-7)
- [ ] Link reference definitions ([label]: url "title")
- [ ] Paragraphs
- [ ] Blank lines

### 2.2 Container blocks
- [ ] Block quotes (> )
- [ ] List items (ordered, unordered, with start number)
- [ ] Lists (tight/loose, nested, mixed markers)
- [ ] Nested container blocks (blockquote in list, list in blockquote)

### 2.3 Inlines
- [ ] Backslash escapes (all ASCII punctuation)
- [ ] Entity and numeric character references (&amp;, &#38;, &#x26;)
- [ ] Code spans (backticks, with spacing rules)
- [ ] Emphasis and strong emphasis (* and _, with flanking rules)
- [ ] Links (inline and reference, with titles)
- [ ] Images (inline and reference)
- [ ] Autolinks (<url>, <email>)
- [ ] Raw HTML (inline)
- [ ] Hard line breaks (two spaces or backslash)
- [ ] Soft line breaks
- [ ] Textual content

### 2.4 Parsing strategy
- [ ] Two-phase parsing: block structure first, then inline structure
- [ ] No backtracking for emphasis (flanking delimiter rules)
- [ ] Proper handling of nested constructs
- [ ] Correct handling of ambiguous cases per spec examples

## 3. GFM extensions (must achieve full compatibility)

- [ ] Tables (pipe tables with alignment, header row, delimiter row)
- [ ] Task list items (- [ ] / - [x])
- [ ] Strikethrough (~~text~~)
- [ ] Autolinks (extension) — bare URLs and email addresses become links
- [ ] Disallowed raw HTML (script, iframe, etc. filtered for security)

## 4. Extended Markdown syntax (Mini extensions)

### 4.1 Footnotes and references
- [ ] Footnote references ([^1])
- [ ] Footnote definitions ([^1]: text)
- [ ] Inline footnotes
- [ ] Bibliography-style references

### 4.2 Callouts and admonitions
- [ ] GitHub-style alerts (> [!NOTE], > [!WARNING], etc.)
- [ ] Custom callout types
- [ ] Collapsible details (<details>)
- [ ] Title support

### 4.3 Extended structures
- [ ] Definition lists
- [ ] Abbreviations
- [ ] Superscript / subscript (^text^, ~text~)
- [ ] Highlight / mark (==text==)
- [ ] Inserted text (++text++)
- [ ] Deleted text (--text--)
- [ ] Keyboard keys (<kbd>)
- [ ] Math inline/display ($...$, $$...$$) — delegates to MiniMath
- [ ] Diagram blocks (```mermaid or ```diagram) — delegates to MiniDiagram
- [ ] Chart blocks (```chart) — delegates to MiniChart
- [ ] Table blocks from data (```table) — delegates to MiniTable
- [ ] Code blocks (```language) — delegates to MiniCode

### 4.4 Document structure
- [ ] YAML/TOML front matter
- [ ] Table of contents generation
- [ ] Section anchors / heading IDs
- [ ] Cross-references (internal links)
- [ ] Document metadata

## 5. Structured documents
- [ ] AST / semantic document model (DocumentNode tree)
- [ ] Block-level nodes (heading, paragraph, list, table, code, etc.)
- [ ] Inline-level nodes (text, emphasis, link, image, code, etc.)
- [ ] Custom node types (extension point)
- [ ] Document traversal and transformation utilities

## 6. Typography
- [ ] Smart quotes ("curly quotes")
- [ ] Dashes (en-dash, em-dash)
- [ ] Ellipsis (...)
- [ ] Non-breaking spaces
- [ ] Typography transforms (configurable)
- [ ] Custom typography rules

## 7. Embedded HTML with security controls
- [ ] Allow safe HTML tags (whitelist approach)
- [ ] Sanitize attributes (remove event handlers, unsafe URLs)
- [ ] Filter dangerous elements (script, iframe, object, embed, form)
- [ ] CSP compatibility (no inline scripts)
- [ ] Configurable HTML policy (strict/relaxed/custom)

## 8. Streaming rendering
- [ ] Incremental block parsing (parse as chunks arrive)
- [ ] Progressive rendering (render completed blocks, hold incomplete)
- [ ] Partial document rendering (render what's parsed so far)
- [ ] Streaming code fence handling (handle unclosed fences gracefully)
- [ ] Backpressure handling (don't overwhelm renderer)
- [ ] Configurable chunk size

## 9. Incremental rendering
- [ ] Dirty tracking (which blocks changed)
- [ ] Partial re-render (only update changed subtrees)
- [ ] Preserve scroll position during updates
- [ ] Efficient diffing of document trees
- [ ] Memoization of rendered blocks
- [ ] Reuse of unchanged subtrees

## 10. Extensible syntax
- [ ] Plugin / extension API
- [ ] Custom block parsers
- [ ] Custom inline parsers
- [ ] Custom renderers (per node type)
- [ ] Syntax extensions (new markers)
- [ ] Configuration-driven extensions

## 11. Cross-module content embedding
- [ ] Math equations (inline and display) via MiniMath
- [ ] Code blocks via MiniCode (syntax highlighting)
- [ ] Diagrams via MiniDiagram
- [ ] Charts via MiniChart
- [ ] Tables via MiniTable (data tables, not just Markdown tables)
- [ ] Nested Markdown (recursive)
- [ ] Embed syntax: fenced code blocks with language info string
- [ ] Embed syntax: inline directives (:::directive)
- [ ] Embed resolution via MiniRender composition (foreign nodes)

## 12. Performance
- [ ] Fast path for simple documents (skip full AST when possible)
- [ ] Lazy parsing (parse only visible content)
- [ ] Virtualization for large documents (render visible blocks only)
- [ ] Streaming parse + render pipeline
- [ ] Minimal allocations (avoid unnecessary intermediate representations)
- [ ] Benchmarks vs marked, remark, micromark, markdown-it

## 13. Accessibility
- [ ] Semantic HTML output (headings, lists, tables, etc.)
- [ ] ARIA attributes where needed
- [ ] Heading hierarchy validation
- [ ] Alt text for images
- [ ] Keyboard navigation for interactive elements
- [ ] Screen reader friendly structure

## 14. Export and serialization
- [ ] HTML export
- [ ] Markdown re-serialization (round-trip)
- [ ] JSON document model export
- [ ] Plain text extraction
- [ ] PDF via shared export infra

## 15. Public API (draft)
```ts
Mini.text.render(markdown, container, options?);
Mini.text.parse(markdown, options?) -> DocumentModel;
Mini.text.renderAsync(markdown); // streaming
const instance = Mini.text.render(markdown, container);
instance.update(markdown);
instance.destroy();
instance.export(format);
```

## 16. Build / distribution
- [ ] Zero runtime deps
- [ ] ESM + CJS + UMD, tree-shakeable
- [ ] Standalone bundle embeddable in single HTML
- [ ] TypeScript declarations
- [ ] Selective extension bundles
