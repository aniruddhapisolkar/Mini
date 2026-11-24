# MiniCode — Feature Inventory

Owner: Jimbo
References: Shiki (https://shiki.style), Prism (https://prismjs.com)
Status: Phase 0 research

## 1. Reference libraries pinned

- Shiki: https://shiki.style — MIT, TypeScript. Uses VS Code's TextMate grammars and themes. Renders to HTML at build time. No client-side JS needed. Used by VitePress, Astro, Nuxt Content. Oniguruma regex engine (WASM). High accuracy.
- Prism: https://prismjs.com — MIT, JavaScript. Lightweight, extensible. Plugin ecosystem (line numbers, diff, toolbar, copy). CSS class-based theming. Used by MDN, Gatsby.
- Additional: highlight.js (auto-detection), TextMate grammar spec, VS Code theme format, Tree-sitter (for incremental parsing), LSP (for semantic highlighting).

License note: Shiki MIT, Prism MIT, highlight.js BSD-3. TextMate grammars (various licenses, mostly MIT/BSL). Oniguruma BSD. Verify before vendoring. No external runtime deps targeted (zero deps) — Oniguruma WASM is a concern; may need pure-JS regex fallback or bundled WASM.

## 2. Syntax highlighting core

### 2.1 Tokenization
- [ ] TextMate grammar-based tokenization (Shiki approach)
- [ ] Prism-style regex-based tokenization (lightweight fallback)
- [ ] Token stream with scope names (e.g., keyword.control, string.quoted)
- [ ] Nested grammar support (embedded languages)
- [ ] Recursive grammar rules
- [ ] Grammar inheritance / injection
- [ ] Lazy grammar loading (per language)
- [ ] Grammar caching (compiled grammars)

### 2.2 Language coverage
- [ ] Comprehensive programming language coverage (100+ languages)
- [ ] Web languages (HTML, CSS, JS, TS, JSX, TSX, Vue, Svelte)
- [ ] Systems languages (C, C++, Rust, Go, Zig)
- [ ] Scripting languages (Python, Ruby, Perl, PHP, Lua, Shell)
- [ ] JVM languages (Java, Kotlin, Scala, Groovy)
- [ ] .NET languages (C#, F#, VB)
- [ ] Functional languages (Haskell, OCaml, Elixir, Clojure, Lisp)
- [ ] Data/config (JSON, YAML, TOML, XML, INI, CSV)
- [ ] Markup (Markdown, LaTeX, HTML)
- [ ] Database (SQL, GraphQL, Prisma)
- [ ] Infrastructure (Dockerfile, Terraform, K8s YAML, GitHub Actions)
- [ ] Scientific (R, Julia, MATLAB)
- [ ] Custom grammar registration

### 2.3 Nested and embedded languages
- [ ] HTML with embedded JS/CSS
- [ ] Markdown with embedded code (delegates to MiniText)
- [ ] Template languages (Jinja, Handlebars, EJS)
- [ ] SQL in string literals
- [ ] Regex literals in JS/Python
- [ ] Custom embedding rules

### 2.4 Themes
- [ ] VS Code theme format support (Shiki)
- [ ] CSS class-based theming (Prism approach)
- [ ] Dual-theme (light/dark) with CSS variables
- [ ] Built-in themes (One Dark, GitHub, Dracula, Nord, etc.)
- [ ] Custom theme creation
- [ ] Theme switching without re-tokenization
- [ ] Scoped CSS variables for theming

## 3. Code rendering features

### 3.1 Code blocks
- [ ] Multiline code blocks (``` fenced)
- [ ] Inline code (`code`)
- [ ] Language specification via info string
- [ ] Fallback for unknown languages (plain text)
- [ ] Code block title / filename
- [ ] Collapsible code blocks

### 3.2 Line features
- [ ] Line numbering (configurable start, step)
- [ ] Line highlighting (specific lines, ranges)
- [ ] Line focus (dim non-highlighted lines)
- [ ] Line diff (added/removed/changed indicators)
- [ ] Word highlighting within lines
- [ ] Line wrapping (soft wrap with indicators)

### 3.3 Annotations
- [ ] Token-level annotations (hover info, tooltips)
- [ ] Line-level annotations (comments, markers)
- [ ] Error/warning markers (squiggles)
- [ ] Breakpoint indicators
- [ ] Custom annotation renderers

### 3.4 Code diffs
- [ ] Unified diff rendering
- [ ] Side-by-side diff
- [ ] Inline diff (word-level)
- [ ] Syntax highlighting in diffs
- [ ] Diff navigation (next/prev change)

### 3.5 Code folding
- [ ] Fold/unfold regions (functions, classes, blocks)
- [ ] Fold indicators
- [ ] Fold by indentation
- [ ] Fold by language constructs (AST-based)
- [ ] Remember fold state

### 3.6 Interactive features
- [ ] Copy to clipboard button
- [ ] Selection support
- [ ] Clickable tokens (go to definition, etc.)
- [ ] Hover tooltips
- [ ] Code execution (explicitly isolated, secured — future)
- [ ] Interactive code blocks (runnable)

### 3.7 Code formatting
- [ ] Language-specific formatting (Prettier, rustfmt, etc. — via optional plugins)
- [ ] Format on render (optional)
- [ ] Indentation normalization

## 4. Performance

### 4.1 Tokenization performance
- [ ] Incremental tokenization (re-tokenize only changed lines)
- [ ] Streaming tokenization (tokenize as code arrives)
- [ ] Worker-based tokenization (offload to Web Worker)
- [ ] Token cache (memoize by content hash)
- [ ] Lazy grammar loading (load grammar on first use)
- [ ] Grammar precompilation (build-time)

### 4.2 Rendering performance
- [ ] Virtual scrolling for large files
- [ ] Lazy rendering (render visible lines only)
- [ ] DOM recycling (reuse spans)
- [ ] Minimal DOM operations (batch updates)
- [ ] Web Worker rendering (Canvas/WebGL backend)

### 4.3 Bundle size
- [ ] Selective language loading (pay per language)
- [ ] Selective theme loading
- [ ] Core engine minimal; grammars/themes separate
- [ ] Tree-shakeable language imports
- [ ] Benchmarks vs Shiki, Prism, highlight.js

## 5. Streaming code rendering
- [ ] Render code as it arrives (streaming input)
- [ ] Handle partial tokens gracefully (don't break mid-token)
- [ ] Progressive highlighting (highlight completed lines, plain for current)
- [ ] Backpressure handling

## 6. Incremental tokenization
- [ ] Line-level diffing (which lines changed)
- [ ] Re-tokenize only changed + affected lines
- [ ] Maintain token state across edits
- [ ] Support for editor-like incremental updates

## 7. Cross-module embedding
- [ ] Code blocks in Markdown (MiniText) — fenced code with language
- [ ] Code in diagram nodes (MiniDiagram)
- [ ] Code in table cells (MiniTable)
- [ ] Code in chart labels/annotations (MiniChart)
- [ ] Inline code in math (MiniMath) — rare but possible

## 8. Accessibility
- [ ] Semantic HTML (pre/code elements)
- [ ] ARIA labels for code blocks
- [ ] Keyboard navigation
- [ ] Screen reader friendly (announce language, line count)
- [ ] High contrast theme support
- [ ] Reduced motion for animations

## 9. Security
- [ ] Code is never executed (rendering only)
- [ ] HTML in code is escaped (not rendered)
- [ ] No eval or dynamic execution
- [ ] CSP compatible (no inline scripts)
- [ ] Input size limits (prevent DoS from huge inputs)
- [ ] Recursion depth limits (for nested grammars)

## 10. Export and serialization
- [ ] HTML export (with inline styles or CSS classes)
- [ ] Plain text extraction
- [ ] Token stream export (JSON)
- [ ] Copy as formatted code

## 11. Public API (draft)
```ts
Mini.code.render(source, options?, container?);
Mini.code.highlight(source, language, options?) -> string; // HTML
Mini.code.tokenize(source, language) -> Token[];
Mini.code.registerLanguage(id, grammar);
Mini.code.registerTheme(id, theme);
const instance = Mini.code.render(source, { language: 'ts' }, container);
instance.update(source);
instance.destroy();
```

## 12. Build / distribution
- [ ] Zero runtime deps (WASM concern for Oniguruma)
- [ ] ESM + CJS + UMD, tree-shakeable
- [ ] Standalone bundle embeddable in single HTML
- [ ] TypeScript declarations
- [ ] Selective language/grammar bundles
- [ ] Selective theme bundles
