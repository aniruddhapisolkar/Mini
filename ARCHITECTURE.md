# Mini — Shared Architecture and Contracts (Phase 0 draft)

Status: **Proposed — Phase 0 draft for review by Alice, Jimbo, Cortana.** Cortana is integration coordinator. No module implementation should begin until this contract is agreed and recorded as final.

Owner of this document: shared (Alice authored initial draft; all three must review and sign off via PR).

## 1. Vision and scope recap

One library, one unified rendering engine (MiniRender), six specialized modules (MiniDiagram, MiniText, MiniMath, MiniCode, MiniChart, MiniTable). Each module independently consumable; internally all share MiniRender. Zero external runtime dependencies. TypeScript-first. Standalone HTML (single file, offline) is a first-class requirement.

Modules:
- Alice: MiniDiagram, MiniMath (+ shared geometry/coordinate primitives)
- Jimbo: MiniText, MiniCode (+ shared parsing/token/text primitives)
- Cortana: MiniChart, MiniTable (+ shared data/virtualization/interaction primitives)
- All: MiniRender

## 2. Rendering pipeline (conceptual)

```
Source / Programmatic Input
            ↓
Domain-Specific Parser
            ↓
Domain-Specific Semantic Representation
            ↓
Domain-Specific Processing and Layout
            ↓
Shared Rendering Interface
            ↓
MiniRender
            ↓
Rendering Backend (HTML | SVG | Canvas | WebGL)
```

Conceptual only: modules may use fast paths, streaming, incremental processing, lazy eval, direct rendering. No unnecessary AST/IR/render-tree allocations. Each module owns its specialized algorithms; MiniRender provides common infrastructure where semantics genuinely align.

## 3. Public API conventions

Unified entry:
```ts
import Mini from "mini";
Mini.math.render(latex, container, options?);
Mini.diagram.render(source, container, options?);
Mini.text.render(markdown, container, options?);
Mini.code.render(source, options?, container?);
Mini.chart.render(spec, container, options?);
Mini.table.render(data, container, options?);
Mini.render(kind, input, container, options?); // unified
Mini.compose([...]); // programmatic composition
```

Selective imports:
```ts
import { math } from "mini/math";
import { diagram } from "mini/diagram";
import { render } from "mini/render";
```

Module kinds (canonical string ids): `"diagram" | "text" | "math" | "code" | "chart" | "table"`.

Rules:
- Container is the last positional arg where ambiguous; prefer options object for extra config.
- All render functions are synchronous where feasible; provide `*Async` variants for lazy-loaded capabilities.
- Return value: a handle/instance with `update()`, `destroy()`, and (where relevant) `export()`.
- Options are plain objects, deeply partial, with documented defaults. No framework coupling.
- Framework adapters (React/Vue/Svelte) are separate packages, not core.

## 4. Module registration contract

MiniRender maintains a registry of modules. Each module registers itself with a `ModuleDescriptor`.

```ts
interface ModuleDescriptor {
  id: ModuleKind;                 // "diagram" | ...
  name: string;                   // "MiniDiagram"
  version: string;                // module version
  capabilities: Capability[];     // declared capabilities
  parse(input, options?): SemanticModel;   // domain parser entry
  render(model, ctx): RenderResult;        // domain renderer entry
  measure?(model, ctx): Size;              // optional intrinsic size
  dispose?(instance): void;
}
```

- Modules register at import time (side-effect registration) OR via explicit `Mini.register(descriptor)`. Default entry registers all six.
- Tree-shaking: importing `mini/math` registers only math. `mini` default registers all.
- Registration is idempotent; duplicate registration throws in dev, warns in prod.
- Capability list drives feature detection and cross-module embedding availability.

## 5. Internal interfaces (shared)

### 5.1 Semantic model
Each module defines its own semantic model type, but all must implement the base:
```ts
interface SemanticModel {
  kind: ModuleKind;
  version: number;                 // model schema version
  metadata?: Record<string, unknown>;
}
```
Models are opaque to MiniRender; MiniRender only routes by `kind`.

### 5.2 Render context
```ts
interface RenderContext {
  backend: Backend;                // active backend
  container: RenderTarget;         // DOM node / canvas / etc.
  scope: StyleScope;              // scoped CSS variables
  resources: ResourceManager;      // fonts, images, grammars
  scheduler: Scheduler;           // frame scheduling
  cache: Cache;                   // shared cache
  diagnostics: Diagnostics;       // errors/warnings
  signal?: AbortSignal;           // cancellation
  mode: "sync" | "stream" | "incremental";
}
```

### 5.3 Render result / handle
```ts
interface RenderHandle {
  id: string;
  kind: ModuleKind;
  root: RenderNode;                // root of render tree (opaque)
  update(input?, options?): void;
  destroy(): void;
  export?(format: ExportFormat): Promise<Blob | string>;
  measure?(): Size;
}
```

### 5.4 Render tree node (shared, minimal)
```ts
interface RenderNode {
  id: string;
  kind: "element" | "text" | "group" | "foreign"; // foreign = embedded module
  children?: RenderNode[];
  bounds?: Rect;
  metadata?: Record<string, unknown>;
}
```
Foreign nodes carry an embedded `RenderHandle` and participate in layout negotiation.

## 6. Backend interfaces

Backends implement:
```ts
interface Backend {
  id: "html" | "svg" | "canvas" | "webgl";
  supports: Capability[];
  createTarget(container): RenderTarget;
  render(node: RenderNode, ctx): void;
  clear(target): void;
  measureText(text, font): TextMetrics;   // where applicable
  dispose(target): void;
}
```

- HTML and SVG are initial general-purpose backends.
- Canvas/WebGL employed where measurable advantage (complex graphics, large datasets, math viz).
- Modules declare which backends they support; MiniRender selects based on request + availability + perf hints.
- No module forced to support all backends if it compromises correctness/accessibility/perf.

## 7. Composition contract (cross-module embedding)

Native requirement. Mechanism:
- A module's semantic model may contain `Embed` nodes: `{ type: "embed", kind: ModuleKind, input, options }`.
- During render, MiniRender resolves embeds by invoking the registered module's `parse` + `render`, producing a `RenderNode` subtree (foreign node).
- Recursive composition supported with a max depth guard (default 16, configurable) to prevent runaway nesting.
- Cyclic references detected by tracking an ancestor set; on cycle, render an error placeholder, emit diagnostic, do not crash.
- Missing module: render a placeholder + diagnostic; never throw.
- Invalid input: render error placeholder + diagnostic.
- Layout negotiation: embedded content reports intrinsic size (`measure`) so parents can lay out; if unavailable, parent uses provided size or fallback.
- Scoped styles: each embedded subtree inherits parent scope but may override via its own scope; no global style leakage.
- Event propagation: events bubble from embedded subtree to host unless `stopPropagation`.
- Lifecycle: parent destroy cascades to embedded handles; shared resources (fonts) reused via ResourceManager.
- Excessive nesting / rendering failures handled gracefully with diagnostics.

## 8. Layout and measurement contract

- Each module provides `measure(model, ctx) -> Size` when intrinsic size is meaningful.
- Layout is module-owned; MiniRender provides shared utilities (geometry, coordinate transforms, text measurement) but no universal layout engine.
- Shared measurement primitives: `measureText`, `fontMetrics`, `bbox`, `Rect`, `Size`, `Point`, `Transform`.
- Layout negotiation protocol: parent requests child size via `measure`; child may request async measurement; parent must handle pending (render placeholder or defer).
- No forced reflow: batch DOM reads/writes; use ResizeObserver for responsive sizing.

## 9. Lifecycle management

Handle states: `created -> rendered -> updated -> destroyed`.
- `destroy()` releases DOM, listeners, resources, cancels pending work.
- Idempotent destroy.
- Parent owns children; destroying parent destroys descendants.
- Resources (fonts, grammars, images, WebGL contexts) managed by ResourceManager with ref-counting; released when last consumer destroyed.
- AbortSignal support for cancellation of async work.

## 10. Error handling

- Structured diagnostics: `{ level, code, message, location?, module, hint? }`.
- Malformed input never crashes the renderer; produce error placeholder + diagnostic.
- `throwOnError` option (default false) for typesetting-style strictness where applicable.
- Source locations (line/col) included when parser supports.
- Security-relevant errors (unsafe URL, XSS attempt) always reported and content dropped, never rendered.

## 11. Security requirements

- No `eval`, no unsafe dynamic execution, no unrestricted HTML injection.
- Sanitize HTML/SVG; filter unsafe URLs (javascript:, data: where inappropriate).
- Prototype pollution guards on option merging.
- Resource exhaustion guards: input size limits, recursion depth limits, render time budgets.
- CSP compatible (no inline scripts; styles via CSS variables/classes).
- Untrusted input handling documented per module.

## 12. Accessibility requirements

- Semantic HTML where applicable (tables, headings).
- ARIA roles/labels on graphics (role="img", aria-label, title/desc).
- MathML output for math.
- Keyboard navigation for interactive components.
- Screen-reader alternatives for graphical output.
- Reduced-motion preference respected (animations).
- Accessible color palettes / theming.

## 13. Styling and theming

- Theming via CSS variables (Pele-style): modules define `--mini-*` / module-specific variables with sensible defaults.
- Colors adapt to theme changes without re-render where possible.
- Scoped styles: each render root gets a scope class; no global leakage.
- Dark mode via CSS variable overrides.

## 14. Performance methodology

- Reproducible benchmarks vs reference libs (Pele/Mermaid, KaTeX/MathJax, Shiki/Prism, Chart.js/Recharts, TanStack/DataTables, CommonMark parsers).
- Measure cold and warm separately; record environment, methodology, variance, limitations.
- Targets: bundle size (min module, full module, incremental, shared engine, complete, gz, brotli), init/render/update latency, memory, GC pressure.
- No fabricated results; no unequal comparisons.
- Optimization must not compromise correctness.

## 15. Testing infrastructure

- TypeScript-first, strict.
- Unit tests per module + shared.
- Compatibility tests against reference (KaTeX function corpus, Mermaid parser specs, CommonMark spec, etc.).
- Integration tests for cross-module composition.
- Visual regression tests.
- Fuzz tests where applicable (parsers).
- Benchmark suite with recorded baselines.
- CI runs tests + typecheck + lint + size budgets.

## 16. Build configuration

- TypeScript declarations, ESM, CJS, UMD.
- Tree-shakeable entry points; side-effect-free modules.
- Bundler-agnostic (works with Vite/Webpack/Rollup/esbuild).
- Standalone browser bundles: complete + selective.
- Zero runtime deps; dev deps only when justified.
- Minification + compression; size budgets enforced in CI.
- Fonts/grammars/styles embeddable in single HTML (base64/data URLs or inlined).

## 17. Distribution requirements

- `mini` (all), `mini/math`, `mini/diagram`, etc. (selective), `mini/render`.
- Standalone: `mini.global.js` (all) and per-module global bundles.
- Offline single-HTML: all required assets inlined or embeddable; no external network/CDN/server.
- Source maps optional (dev).

## 18. Directory / repo conventions

```
Mini/
├── MiniDiagram/   (Alice)
├── MiniText/      (Jimbo)
├── MiniMath/      (Alice)
├── MiniCode/      (Jimbo)
├── MiniChart/     (Cortana)
├── MiniTable/     (Cortana)
├── MiniRender/    (shared)
├── tests/         (shared + per-module)
├── benchmarks/
├── docs/
├── examples/
├── AGENTS.md
├── ARCHITECTURE.md
├── README.md
├── LICENSE
├── package.json
└── tsconfig.json
```

Branches: `main`, `alice/spatial`, `jimbo/semantic`, `cortana/data`, `integration/render`. PRs for review/integration. No force-push to shared branches.

## 19. Minimal MiniRender foundation (Phase 1 scope)

Together, establish minimal functional foundation to support parallel module dev:
- Core interfaces (this doc, sections 4-9)
- Module registration (section 4)
- Basic rendering lifecycle (section 9)
- Backend contracts (section 6) — HTML + SVG
- Shared primitives (geometry, text measurement, DOM utils)
- Basic composition (section 7) — one level of embedding
- Testing + benchmarking foundations

Create small reference implementations demonstrating contracts work across domains (e.g., render a math expression inside a diagram node; render code inside a table cell).

Do not complete entire engine in Phase 1.

## 20. Open decisions / items needing agreement

1. Exact module descriptor registration mechanism (side-effect vs explicit) — proposed: both, default side-effect on default entry.
2. Max composition depth default (proposed 16).
3. Whether MiniRender owns a global style scope injection or modules inject their own — proposed: MiniRender injects a single scope root per render, modules contribute variables.
4. Shared cache key scheme — to be defined in Phase 1.
5. Error placeholder rendering ownership — proposed: MiniRender provides default error placeholder; modules may override.
6. Font loading strategy for standalone HTML — proposed: inlined base64 fonts in standalone bundle; modular uses CSS @font-face with relative URLs.

Jimbo: please add MiniText/MiniCode feature inventories and review sections 2,4,5,7 for text/code concerns (token representation, streaming, incremental rendering).
Cortana: review sections 6,8,9 for data/virtualization/interaction concerns and confirm shared virtualization util location.

## 21. Next steps

- All: review this draft; open PR comments.
- Jimbo: create MiniText/MiniCode feature inventories (mirror MiniChart/MiniTable format).
- Alice: finalize MiniDiagram/MiniMath inventories (done).
- Cortana: confirm MiniChart/MiniTable inventories (done).
- Together: agree on final ARCHITECTURE.md, then begin Phase 1 minimal MiniRender foundation.
- No independent module implementation until contracts agreed.


---

## Appendix A — Jimbo Review (MiniText / MiniCode concerns)

Reviewer: Jimbo (MiniText, MiniCode)
Date: Phase 0 review

### A.1 Token representation (affects MiniText, MiniCode, and cross-module embedding)

MiniText produces inline nodes (text, emphasis, code, link, image, etc.). MiniCode produces syntax-highlighted token streams. Both need a shared span/token primitive so that MiniRender and cross-module embedding can handle them uniformly.

**Proposal:** Add a shared `Span` interface in section 5 (Internal interfaces):

```ts
interface Span {
  text: string;
  kind: string;          // module-defined kind, e.g. "emphasis", "keyword", "string"
  range: [number, number]; // source offsets
  children?: Span[];
  style?: Record<string, string>; // optional style hints
}
```

- MiniText inline nodes can be represented as `Span` trees.
- MiniCode tokens can be represented as `Span` trees with `kind` = TextMate scope.
- MiniRender uses `Span` for text measurement, layout, and accessibility.
- This avoids duplicating token/span representations across modules.

### A.2 Streaming rendering contract (affects MiniText, MiniCode)

MiniText and MiniCode both need streaming. The current `RenderContext.mode` includes `"stream"` but the contract is unspecified.

**Proposal:** Define a streaming contract:

```ts
interface StreamController {
  push(chunk: string): void;      // append input
  flush(): void;                  // finalize
  onProgress(cb: (partial: RenderHandle) => void): void;
}
```

- Modules parse incrementally; render completed blocks/lines; hold incomplete ones.
- MiniRender schedules partial updates via the Scheduler.
- Backpressure: if render falls behind parse, drop intermediate renders (keep latest).
- Streaming code: handle partial tokens (don't break mid-token); render plain text for incomplete line.
- Streaming markdown: handle unclosed fences (treat as code block until closed).

### A.3 Incremental rendering contract (affects all, critical for text/code)

**Proposal:** Define dirty-tracking and partial update:

```ts
interface IncrementalUpdate {
  changedRanges: Array<{ start: number; end: number }>;  // source offsets
  strategy: "patch" | "rebuild";  // module decides
}
```

- MiniText: re-parse only changed blocks; re-render only changed subtrees; preserve scroll.
- MiniCode: re-tokenize only changed lines + affected lines (indentation changes can affect folding).
- MiniRender provides shared diffing utility: `diffNodes(prev, next) -> patches`.
- Handle state: `created -> rendered -> updated -> destroyed` already defined; add `updated` event.

### A.4 Text measurement primitive (affects MiniText, layout)

MiniText needs text measurement for wrapping, layout, and responsive sizing. Currently section 8 mentions `measureText` on Backend.

**Proposal:** Promote to shared primitive:

```ts
interface TextMeasurer {
  measure(text: string, font: FontSpec): TextMetrics;
  measureRange(text: string, font: FontSpec, start: number, end: number): TextMetrics;
  lineHeight(font: FontSpec): number;
  wrap(text: string, font: FontSpec, maxWidth: number): string[];
}
```

- Backend implements `TextMeasurer` (uses Canvas measureText or DOM).
- MiniText uses it for paragraph wrapping, heading sizing, table cell sizing.
- MiniCode uses it for line width, horizontal scroll detection.
- Shared by MiniRender layout utilities.

### A.5 Code block embedding in Markdown (cross-module)

MiniText embeds MiniCode for fenced code blocks (```ts). This is the most common cross-module embedding.

**Concern:** The embed mechanism (section 7) resolves embeds during render. For code blocks, we want syntax highlighting. If MiniCode is not loaded, fallback to plain text code block (no crash).

**Proposal:** 
- MiniText parser detects fenced code blocks with language info string.
- Creates `Embed` node with `kind: "code"`, `input: source`, `options: { language }`.
- MiniRender resolves via registered MiniCode module; if unavailable, renders plain `<pre><code>`.
- Lazy-load MiniCode on first code block encounter (if not already loaded).

### A.6 Math embedding in Markdown

MiniText embeds MiniMath for `$...$` and `$$...$$`.

**Proposal:** Same pattern as code blocks. MiniText parser detects math delimiters. Creates Embed node with kind "math". Lazy-load MiniMath on first encounter.

### A.7 Open decisions — Jimbo's input

1. Module descriptor registration: agree with both side-effect + explicit. MiniText/MiniCode should support lazy loading of grammars/extensions.
2. Max composition depth 16: agree. Markdown can nest deeply; code blocks in tables in diagrams could nest. 16 is reasonable.
3. Global style scope injection: MiniRender should inject; modules contribute CSS variables. MiniCode themes need scoped variables.
4. Shared cache key scheme: propose `hash(moduleKind + input + options)`. MiniText can cache by document hash; MiniCode by (source hash + language + theme).
5. Error placeholder: MiniRender default is fine. MiniText should show raw source on parse failure; MiniCode should show plain text.
6. Font loading: agree. MiniCode needs monospace fonts; include in standalone bundle.

### A.8 Additional concerns

- **HTML sanitization in Markdown**: GFM disallowed raw HTML. MiniText must filter script, iframe, etc. This is security-critical. Propose MiniRender provides a shared `sanitizeHtml` utility.
- **Incremental tokenization for code editors**: If MiniCode is used in an editor (future), incremental tokenization is essential. The token state must be preserved across edits. Propose a `TokenState` that can be diffed.
- **Text processing primitives**: MiniText establishes text processing (escape handling, entity decoding, whitespace normalization). Propose shared `TextProcessor` utility in MiniRender for all modules.
- **Typography infrastructure**: MiniText establishes typography (smart quotes, dashes, etc.). Propose shared `Typography` utility, configurable per module.

### A.9 Sections reviewed: 2, 4, 5, 7

- Section 2 (pipeline): agree. Add note that MiniText/MiniCode may skip AST for simple inputs (fast path).
- Section 4 (registration): agree. Add lazy grammar loading for MiniCode; lazy extension loading for MiniText.
- Section 5 (interfaces): agree. Add `Span`, `TextMeasurer` (see above).
- Section 7 (composition): agree. Add code/math embedding specifics (see A.5, A.6).
