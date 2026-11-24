# Mini — Shared Architecture and Contracts

**Status: Final — Phase 0 agreed by Alice, Jimbo, and Cortana.**
**Integration coordinator: Cortana.**
**No module implementation should begin until this contract is agreed and recorded as final.**

Owner of this document: shared (Alice authored initial draft; Jimbo added Appendix A; Cortana reviewed and consolidated; all three agreed).

---

## 1. Vision and scope recap

One library, one unified rendering engine (MiniRender), six specialized modules (MiniDiagram, MiniText, MiniMath, MiniCode, MiniChart, MiniTable). Each module independently consumable; internally all share MiniRender. Zero external runtime dependencies. TypeScript-first. Standalone HTML (single file, offline) is a first-class requirement.

Modules:
- Alice: MiniDiagram, MiniMath (+ shared geometry/coordinate primitives)
- Jimbo: MiniText, MiniCode (+ shared parsing/token/text primitives)
- Cortana: MiniChart, MiniTable (+ shared data/virtualization/interaction primitives)
- All: MiniRender

---

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

Modules may skip AST construction for simple inputs (fast path). MiniText/MiniCode may render plain text directly for trivial content.

---

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

---

## 4. Module registration contract

MiniRender maintains a registry of modules. Each module registers itself with a `ModuleDescriptor`.

**Registration is explicit and tree-shakeable. No side-effect imports. No mandatory global registry.**

- Modules do NOT auto-register on import. They export descriptors; registration is the caller's responsibility.
- `Mini.register(descriptor)` registers a module explicitly.
- `import { math } from "mini/math"` returns a registration handle, not a side effect.
- The default `mini` entry explicitly registers all six modules in its entry point code (explicit composition, not side effects).
- Registration is idempotent; duplicate registration throws in dev, warns in prod.
- Capability list drives feature detection and cross-module embedding availability.

```ts
type Capability =
  | "render:html" | "render:svg" | "render:canvas" | "render:webgl"
  | "measure:intrinsic" | "measure:async"
  | "compose:embed" | "compose:recursive"
  | "export:png" | "export:svg" | "export:pdf" | "export:json"
  | "a11y:aria" | "a11y:keyboard" | "a11y:screenreader"
  | "perf:virtualize" | "perf:stream" | "perf:incremental";

type BackendId = "html" | "svg" | "canvas" | "webgl";

interface ModuleDescriptor {
  id: ModuleKind;
  name: string;
  version: string;
  capabilities: Capability[];
  supportedBackends: BackendId[];
  parse(input: unknown, options?: unknown): SemanticModel;
  render(model: SemanticModel, ctx: RenderContext): RenderResult;
  measure?(model: SemanticModel, ctx: RenderContext, constraints?: MeasureConstraints): MeasureResult;
  dispose?(instance: RenderHandle): void;
}
```

Lazy loading: MiniCode supports lazy grammar loading; MiniText supports lazy extension loading. MiniRender lazy-loads modules on first use when not explicitly registered.

---

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

### 5.3 Render result

```ts
interface RenderResult {
  handle: RenderHandle;
  node?: RenderNode;
}
```

### 5.4 Render tree node (shared, minimal, extensible)

```ts
interface RenderNode<K extends string = string> {
  id: string;
  kind: "element" | "text" | "group" | "foreign" | K;  // K allows domain-specific kinds
  children?: RenderNode<K>[];
  bounds?: Rect;
  metadata?: Record<string, unknown>;
}
```

- `kind` is extensible via generic type parameter for domain-specific node types (e.g., `RenderNode<"chart-plot" | "table-row" | "code-token">`).
- `foreign` nodes carry an embedded `RenderHandle` for cross-module composition.
- **Fast paths**: Modules may skip RenderNode construction entirely and render directly to backend when appropriate (e.g., Canvas chart rendering). RenderNode is required only for composition, measurement, and backend abstraction.
- RenderNode is NOT a universal AST — it's a minimal shared representation for composition and layout negotiation.

### 5.5 Span (shared token primitive)

```ts
interface Span {
  text: string;
  kind: string;               // module-defined kind, e.g. "emphasis", "keyword", "string"
  range: [number, number];    // source offsets
  children?: Span[];
  style?: Record<string, string>;  // optional style hints
  // Chart/Table extension (optional)
  dataRef?: { row?: number; col?: number; series?: number; point?: number };
}
```

- MiniText inline nodes can be represented as `Span` trees.
- MiniCode tokens can be represented as `Span` trees with `kind` = TextMate scope.
- MiniRender uses `Span` for text measurement, layout, and accessibility.
- `dataRef` allows chart/table renderers to link spans to data points for tooltips/interaction.

### 5.6 TextMeasurer (shared primitive)

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
- MiniChart uses it for axis labels, legend sizing, tooltip dimensions.
- MiniTable uses it for column width auto-calculation.

---

## 6. Backend interfaces

Backends implement:

```ts
interface Backend {
  id: BackendId;
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
- Modules declare which backends they support via `supportedBackends`; MiniRender selects based on request + availability + perf hints.
- No module forced to support all backends if it compromises correctness/accessibility/perf.

### Backend Capability Negotiation

- `MiniRender.resolveBackend(requested, moduleSupported, available)` returns the best backend or emits a structured diagnostic if none available.
- Fallback chain: requested → module-supported → globally-available → HTML (universal fallback).
- If a module doesn't support the resolved backend, MiniRender renders an error placeholder + diagnostic (never crashes).
- Backend selection is recorded in diagnostics for debugging.
- When a backend lacks a capability, the module's render path must handle gracefully; `Backend.supports` is checked before invoking backend-specific code.

---

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

### Module-Specific Embedding

- **MiniText embeds MiniCode**: fenced code blocks with language info string → `Embed` node with `kind: "code"`. Lazy-load MiniCode on first encounter. If unavailable, render plain `<pre><code>`.
- **MiniText embeds MiniMath**: `$...$` and `$$...$$` delimiters → `Embed` node with `kind: "math"`. Lazy-load MiniMath on first encounter.
- **MiniChart embeds MiniMath**: math labels in chart axes → `Embed` node with `kind: "math"`.
- **MiniTable embeds all modules**: embedded content in cells → `Embed` nodes with appropriate kind.

---

## 8. Layout and measurement contract

Constraint-based measurement contract (per user direction):

```ts
interface MeasureConstraints {
  availableWidth?: number;
  availableHeight?: number;
  minWidth?: number;
  minHeight?: number;
  aspectRatio?: number;
}

interface MeasureResult {
  intrinsic: Size;          // natural/preferred size
  min: Size;                // minimum viable size
  max?: Size;               // maximum useful size
  baseline?: number;        // text baseline offset from top
  bbox: Rect;               // bounding box
}
```

- Each module provides `measure(model, ctx, constraints?) -> MeasureResult` when intrinsic size is meaningful.
- `measure()` is called with optional constraints; returns intrinsic dimensions.
- Baseline support for text-aligned composition.
- Bounding box (`Rect`) derived from `MeasureResult`.
- Coordinate transforms (`Transform`) applied during layout.
- Layout invalidation: when inputs change, module calls `ctx.scheduler.invalidate(nodeId)` to trigger re-measurement.
- Layout is module-owned; MiniRender provides shared utilities (geometry, coordinate transforms, text measurement) but no universal layout engine.
- No forced reflow: batch DOM reads/writes; use ResizeObserver for responsive sizing.
- Domain-specific layout algorithms remain within their respective modules.

---

## 9. Lifecycle management

Handle states: `created -> rendered -> updated -> destroyed`.
- `destroy()` releases DOM, listeners, resources, cancels pending work.
- Idempotent destroy.
- Parent owns children; destroying parent destroys descendants.
- AbortSignal support for cancellation of async work.

### Resource Ownership and Disposal

- `ResourceManager` maintains a ref-counted registry of shared resources (fonts, grammars, images, WebGL contexts, shader programs).
- Each resource has an owner (the module instance that created it) and consumers (modules that use it).
- On `destroy()`: module releases its resources; ResourceManager decrements ref counts; resource disposed when count reaches 0.
- Shared resources (e.g., a font used by both MiniMath and MiniChart) are NOT disposed until all consumers are destroyed.
- Resource leak detection in dev mode (warn if resources remain after destroy).

---

## 10. Error handling

- Structured diagnostics: `{ level, code, message, location?, module, hint? }`.
- Malformed input never crashes the renderer; produce error placeholder + diagnostic.
- `throwOnError` option (default false) for typesetting-style strictness where applicable.
- Source locations (line/col) included when parser supports.
- Security-relevant errors (unsafe URL, XSS attempt) always reported and content dropped, never rendered.
- MiniRender provides default error placeholder; modules may override. MiniText shows raw source on parse failure; MiniCode shows plain text.

---

## 11. Security requirements

- No `eval`, no unsafe dynamic execution, no unrestricted HTML injection.
- Sanitize HTML/SVG; filter unsafe URLs (javascript:, data: where inappropriate).
- Prototype pollution guards on option merging.
- Resource exhaustion guards: input size limits, recursion depth limits, render time budgets.
- CSP compatible (no inline scripts; styles via CSS variables/classes).
- Untrusted input handling documented per module.
- MiniChart/MiniTable must handle untrusted data (XSS via cell content, chart labels).
- Data size limits to prevent DoS (max rows, max data points).
- Input validation before processing.
- MiniRender provides shared `sanitizeHtml` utility used by all modules.

---

## 12. Accessibility requirements

- Semantic HTML where applicable (tables, headings).
- ARIA roles/labels on graphics (role="img", aria-label, title/desc).
- MathML output for math.
- Keyboard navigation for interactive components.
- Screen-reader alternatives for graphical output.
- Reduced-motion preference respected (animations).
- Accessible color palettes / theming.
- `prefers-color-scheme` and `prefers-reduced-motion` support.

---

## 13. Styling and theming

- Theming via CSS variables (Pele-style): modules define `--mini-*` / module-specific variables with sensible defaults.
- Colors adapt to theme changes without re-render where possible.
- Scoped styles: each render root gets a scope class; no global leakage.
- Dark mode via CSS variable overrides.
- MiniRender injects a single scope root per render; modules contribute CSS variables.
- MiniChart: theme-aware color palettes (`--mini-chart-color-1`, etc.).
- MiniTable: theme-aware row/cell styling.
- MiniCode: theme-aware syntax highlighting variables.

---

## 14. Streaming contract

```ts
interface StreamController<T = string> {
  push(chunk: T): void;           // append input
  flush(): void;                  // finalize
  onProgress(cb: (partial: RenderHandle) => void): void;
  // Data extension
  pushData(rows: unknown[]): void; // for table/chart streaming
  onBackpressure(cb: () => void): void; // notify when render falls behind
}
```

- Modules parse incrementally; render completed blocks/lines; hold incomplete ones.
- MiniRender schedules partial updates via the Scheduler.
- Backpressure: if render falls behind parse, drop intermediate renders (keep latest).
- Streaming code: handle partial tokens (don't break mid-token); render plain text for incomplete line.
- Streaming markdown: handle unclosed fences (treat as code block until closed).
- MiniChart/MiniTable use `pushData` for real-time data streams.

---

## 15. Incremental rendering contract

```ts
interface IncrementalUpdate {
  changedRanges: Array<{ start: number; end: number }>;  // source offsets (text/code)
  changedData?: { rows?: number[]; cols?: number[]; series?: number[] };  // data indices (chart/table)
  strategy: "patch" | "rebuild";  // module decides
}
```

- MiniText: re-parse only changed blocks; re-render only changed subtrees; preserve scroll.
- MiniCode: re-tokenize only changed lines + affected lines.
- MiniChart: re-render only changed series/points.
- MiniTable: re-render only changed rows/cells.
- MiniRender provides shared diffing utility: `diffNodes(prev, next) -> patches`.
- Handle state: `created -> rendered -> updated -> destroyed`; add `updated` event.

---

## 16. Performance methodology

- Reproducible benchmarks vs reference libs (Pele/Mermaid, KaTeX/MathJax, Shiki/Prism, Chart.js/Recharts, TanStack/DataTables, CommonMark parsers).
- Measure cold and warm separately; record environment, methodology, variance, limitations.
- Targets: bundle size (min module, full module, incremental, shared engine, complete, gz, brotli), init/render/update latency, memory, GC pressure.
- No fabricated results; no unequal comparisons.
- Optimization must not compromise correctness.

---

## 17. Testing infrastructure

- TypeScript-first, strict.
- Unit tests per module + shared.
- Compatibility tests against reference (KaTeX function corpus, Mermaid parser specs, CommonMark spec, etc.).
- Integration tests for cross-module composition.
- Visual regression tests.
- Fuzz tests where applicable (parsers).
- Benchmark suite with recorded baselines.
- CI runs tests + typecheck + lint + size budgets.

---

## 18. Build configuration

- TypeScript declarations, ESM, CJS, UMD.
- Tree-shakeable entry points; side-effect-free modules.
- Bundler-agnostic (works with Vite/Webpack/Rollup/esbuild).
- Standalone browser bundles: complete + selective.
- Zero runtime deps; dev deps only when justified.
- Minification + compression; size budgets enforced in CI.
- Fonts/grammars/styles embeddable in single HTML (base64/data URLs or inlined).

---

## 19. Distribution requirements

- `mini` (all), `mini/math`, `mini/diagram`, etc. (selective), `mini/render`.
- Standalone: `mini.global.js` (all) and per-module global bundles.
- Offline single-HTML: all required assets inlined or embeddable; no external network/CDN/server.
- Source maps optional (dev).

### Standalone HTML Licensing Concern

- Oniguruma (used by Shiki for TextMate grammars, BSD license) has a WASM dependency. For standalone HTML: Option C (optional capability, loaded only when TextMate grammars used) as primary; Option A (inlined WASM as base64) as fallback for full standalone. Prism's regex-based highlighting works without Oniguruma.
- KaTeX fonts: individual font license verification pending (Alice).
- D3 submodules (used by Recharts, BSD-3-Clause): individual license verification pending (Cortana).
- jQuery (used by DataTables, MIT): license verification pending (Cortana).
- Comprehensive THIRD_PARTY_NOTICES.md to be created in Phase 1.

---

## 20. Directory / repo conventions

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

### Shared Utilities Location

- `MiniRender/virtualization/` — shared virtualization algorithms (row/column virtualization, scroll position, overscan). Consumed by MiniTable and MiniChart.
- `MiniRender/text/` — shared text processing (`TextProcessor`, `Typography`, `sanitizeHtml`).
- `MiniRender/geometry/` — shared geometry primitives (Rect, Size, Point, Transform).

---

## 21. Minimal MiniRender foundation (Phase 1 scope)

Together, establish minimal functional foundation to support parallel module dev:
- Core interfaces (this doc, sections 4-9, 14-15)
- Module registration (section 4)
- Basic rendering lifecycle (section 9)
- Backend contracts (section 6) — HTML + SVG
- Shared primitives (geometry, text measurement, DOM utils, virtualization, text processing)
- Basic composition (section 7) — one level of embedding
- Streaming and incremental foundations (sections 14-15)
- Testing + benchmarking foundations

Create small reference implementations demonstrating contracts work across domains (e.g., render a math expression inside a diagram node; render code inside a table cell).

Do not complete entire engine in Phase 1.

---

## 22. Open decisions — all agreed

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Module registration mechanism | Explicit only, no side-effect imports |
| 2 | Max composition depth default | 16, configurable |
| 3 | Global style scope injection | MiniRender injects single scope root; modules contribute CSS variables |
| 4 | Shared cache key scheme | `hash(moduleKind + input + options)`; finalize in Phase 1 |
| 5 | Error placeholder ownership | MiniRender provides default; modules may override |
| 6 | Font loading for standalone HTML | Inlined base64 in standalone bundle; modular uses CSS @font-face |
| 7 | Virtualization util location | Shared in `MiniRender/virtualization/` |
| 8 | Backend fallback chain | requested → module-supported → globally-available → HTML |
| 9 | RenderNode domain-specific kinds | Extensible via generic type parameter |
| 10 | MeasureResult baseline | Included for text-aligned composition |

---

## 23. Next steps

- All: Phase 0 complete. Review final ARCHITECTURE.md.
- Together: begin Phase 1 — minimal MiniRender foundation.
- Alice: finalize MiniDiagram/MiniMath inventories (done); per-asset licensing checks (fonts).
- Jimbo: MiniText/MiniCode inventories (done); Oniguruma WASM investigation.
- Cortana: MiniChart/MiniTable inventories (done); D3/jQuery license verification.
- All: create THIRD_PARTY_NOTICES.md in Phase 1.

---

*Agreed by Alice, Jimbo, and Cortana — Phase 0 complete.*
