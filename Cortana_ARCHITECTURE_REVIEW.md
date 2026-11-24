# Cortana's Review of ARCHITECTURE.md (Phase 0)

## Reviewer: Cortana (integration coordinator)
## Document reviewed: Alice's draft on branch `alice/spatial`, ARCHITECTURE.md
## Date: Phase 0

## Overall Assessment

Alice's draft is comprehensive and well-structured. It covers all major areas from AGENTS.md section 20. I agree with most of the proposed contracts. Below are my section-specific reviews, proposed changes incorporating the user's architectural directions, and open items.

---

## Section 6 — Backend Interfaces (REVIEW + PROPOSED CHANGES)

**Alice's draft**: Backends implement `Backend` interface with `id`, `supports`, `createTarget`, `render`, `clear`, `measureText`, `dispose`. Modules declare which backends they support; MiniRender selects based on request + availability + perf hints.

**My review**: Good foundation. Needs explicit backend capability negotiation protocol.

**Proposed additions**:

### Backend Capability Negotiation
- Each module declares `supportedBackends: BackendId[]` in its `ModuleDescriptor`.
- `MiniRender.resolveBackend(requested, moduleSupported, available)` returns the best backend or throws a structured diagnostic if none available.
- Fallback chain: requested → module-supported → globally-available → HTML (universal fallback).
- If a module doesn't support the resolved backend, MiniRender renders an error placeholder + diagnostic (never crashes).
- Backend selection is recorded in diagnostics for debugging.

### Unsupported Operation Handling
- When a backend lacks a capability (e.g., WebGL on a non-GPU device), the module's render path must handle gracefully.
- `Backend.supports` is a `Capability[]`; MiniRender checks before invoking backend-specific code.
- Modules may provide backend-specific fast paths; if unavailable, fall back to a general path.

---

## Section 8 — Layout and Measurement Contract (REVIEW + PROPOSED CHANGES)

**Alice's draft**: Each module provides `measure(model, ctx) -> Size`. Layout is module-owned. Shared measurement primitives: `measureText`, `fontMetrics`, `bbox`, `Rect`, `Size`, `Point`, `Transform`. Layout negotiation protocol: parent requests child size via `measure`; child may request async measurement; parent must handle pending.

**My review**: Needs constraint-based measurement contract per user direction.

**Proposed additions**:

### Constraint-Based Measurement Contract
```ts
interface MeasureConstraints {
  maxWidth?: number;          // available width
  maxHeight?: number;         // available height
  minWidth?: number;           // minimum width
  minHeight?: number;         // minimum height
  aspectRatio?: number;       // preferred aspect ratio
}

interface MeasureResult {
  width: number;              // intrinsic/preferred width
  height: number;             // intrinsic/preferred height
  baseline?: number;          // text baseline offset from top
  minWidth?: number;          // minimum width
  minHeight?: number;         // minimum height
  maxWidth?: number;          // maximum width
  maxHeight?: number;         // maximum height
}

interface Measurable {
  measure(constraints?: MeasureConstraints): MeasureResult;
}
```

- `measure()` is called with optional constraints; returns intrinsic dimensions.
- Baseline support for text-aligned composition.
- Bounding box (`Rect`) derived from `MeasureResult`.
- Coordinate transforms (`Transform`) applied during layout.
- Layout invalidation: when inputs change, module calls `ctx.scheduler.invalidate(nodeId)` to trigger re-measurement.

### Shared Virtualization Utilities Location
**Decision**: Shared virtualization algorithms (row/column virtualization, scroll position management, overscan) live in `MiniRender/virtualization/` and are consumed by MiniTable and MiniChart. Domain-specific virtualization policies (e.g., chart point decimation) remain in their modules.

---

## Section 9 — Lifecycle Management (REVIEW + PROPOSED CHANGES)

**Alice's draft**: Handle states: `created -> rendered -> updated -> destroyed`. `destroy()` releases DOM, listeners, resources. Idempotent destroy. Parent owns children. Resources managed by ResourceManager with ref-counting.

**My review**: Good. Needs explicit resource ownership and disposal rules.

**Proposed additions**:

### Resource Ownership and Disposal
- `ResourceManager` maintains a ref-counted registry of shared resources (fonts, grammars, images, WebGL contexts, shader programs).
- Each resource has an owner (the module instance that created it) and consumers (modules that use it).
- On `destroy()`: module releases its resources; ResourceManager decrements ref counts; resource disposed when count reaches 0.
- Shared resources (e.g., a font used by both MiniMath and MiniChart) are NOT disposed until all consumers are destroyed.
- `AbortSignal` support for cancellation of async resource loading.
- Resource leak detection in dev mode (warn if resources remain after destroy).

---

## Section 5.4 — Render Tree Node (REVIEW + PROPOSED CHANGES)

**Alice's draft**: Simple `RenderNode` with `id`, `kind` ("element" | "text" | "group" | "foreign"), `children`, `bounds`, `metadata`.

**My review**: Needs to support domain-specific node types and fast paths per user direction.

**Proposed changes**:

### Minimal, Extensible RenderNode
```ts
interface RenderNode<T extends string = string> {
  id: string;
  kind: "element" | "text" | "group" | "foreign" | T;  // T allows domain-specific kinds
  children?: RenderNode[];
  bounds?: Rect;
  metadata?: Record<string, unknown>;
}
```

- `kind` is extensible via generic type parameter for domain-specific node types (e.g., `RenderNode<"chart-plot" | "table-row">`).
- `foreign` nodes carry an embedded `RenderHandle` for cross-module composition.
- **Fast paths**: Modules may skip RenderNode construction entirely and render directly to backend when appropriate (e.g., Canvas chart rendering). RenderNode is required only for composition, measurement, and backend abstraction.
- RenderNode is NOT a universal AST — it's a minimal shared representation for composition and layout negotiation.

---

## Section 4 — Module Registration Contract (REVIEW + PROPOSED CHANGES)

**Alice's draft**: Modules register at import time (side-effect) OR via explicit `Mini.register(descriptor)`. Default entry registers all six. Tree-shaking: importing `mini/math` registers only math.

**My review**: User direction says avoid automatic side-effect imports. Need to change.

**Proposed changes**:

### Explicit, Tree-Shakeable Registration
- **No side-effect registration**. Modules do NOT auto-register on import.
- Registration is always explicit: `Mini.register(mathDescriptor)` or `import { math } from "mini/math"` (which exports the descriptor but does not register it).
- Default entry (`mini`) explicitly registers all six modules in its entry point code (not via side effects).
- `ModuleDescriptor` includes `supportedBackends`, `capabilities` (typed), and optional `measure`, `render`, `parse`, `dispose`.
- Idempotent registration: duplicate registration throws in dev, warns in prod.
- Capability declarations are typed enums, not strings, for compile-time safety.

```ts
type Capability =
  | "render:html" | "render:svg" | "render:canvas" | "render:webgl"
  | "measure:intrinsic" | "measure:async"
  | "compose:embed" | "compose:recursive"
  | "export:png" | "export:svg" | "export:pdf" | "export:json"
  | "a11y:aria" | "a11y:keyboard" | "a11y:screenreader"
  | "perf:virtualize" | "perf:stream" | "perf:incremental";

interface ModuleDescriptor {
  id: ModuleKind;
  name: string;
  version: string;
  capabilities: Capability[];
  supportedBackends: BackendId[];
  parse(input: unknown, options?: unknown): SemanticModel;
  render(model: SemanticModel, ctx: RenderContext): RenderResult;
  measure?(model: SemanticModel, ctx: RenderContext): MeasureResult;
  dispose?(instance: RenderHandle): void;
}
```

---

## Section 11 — Security Requirements (REVIEW)

**Alice's draft**: No eval, sanitize HTML/SVG, filter unsafe URLs, prototype pollution guards, resource exhaustion guards, CSP compatible, untrusted input handling documented per module.

**My review**: Agree. Add for data-specific concerns:
- MiniChart/MiniTable must handle untrusted data (XSS via cell content, chart labels).
- Data size limits to prevent DoS (max rows, max data points).
- Input validation before processing.

---

## Section 13 — Styling and Theming (REVIEW)

**Alice's draft**: Theming via CSS variables (Pele-style). Colors adapt to theme changes without re-render. Scoped styles. Dark mode via CSS variable overrides.

**My review**: Agree. Add:
- MiniChart needs theme-aware color palettes (chart-specific variables: `--mini-chart-color-1`, etc.).
- MiniTable needs theme-aware row/cell styling.
- Both should respect `prefers-color-scheme` and `prefers-reduced-motion`.

---

## Section 6 — Additional: Shared vs Domain-Specific Infrastructure

**Proposed addition to ARCHITECTURE.md**:

### Shared Infrastructure (MiniRender owns)
- Backend abstraction and selection
- Resource management (fonts, images, grammars, WebGL contexts)
- Scheduling and frame management
- Caching infrastructure
- Event system and propagation
- Composition and embedding orchestration
- Error handling and diagnostics
- Accessibility primitives (ARIA, semantic HTML helpers)
- Security utilities (sanitization, URL filtering)
- Measurement primitives (geometry, text measurement, coordinate transforms)
- Virtualization algorithms (shared, consumed by MiniTable/MiniChart)

### Domain-Specific (modules own)
- Parsing and semantic models
- Layout algorithms
- Rendering logic and visual output
- Data processing and transformations
- Interaction handling (module-specific)
- Export format generation (module-specific fidelity)

### Rule of Thumb
If two modules need the same infrastructure, it goes in MiniRender. If only one module needs it, it stays in the module. No premature abstraction.

---

## Open Decisions — My Positions

1. **Module registration**: Explicit only, no side effects. (User direction confirmed.)
2. **Max composition depth**: 16 default, configurable. Agree with Alice.
3. **Style scope injection**: MiniRender injects a single scope root per render; modules contribute CSS variables. Agree with Alice.
4. **Shared cache key scheme**: Defer to Phase 1. Agree.
5. **Error placeholder ownership**: MiniRender provides default; modules may override. Agree with Alice.
6. **Font loading for standalone HTML**: Inlined base64 in standalone bundle; modular uses CSS @font-face with relative URLs. Agree with Alice.

## New Open Decisions from My Review

7. **Virtualization util location**: Shared in `MiniRender/virtualization/`. (Proposed above.)
8. **Backend fallback chain**: requested → module-supported → globally-available → HTML. (Proposed above.)
9. **RenderNode generic type**: Extensible via generic parameter for domain-specific kinds. (Proposed above.)
10. **MeasureResult baseline**: Include baseline for text-aligned composition. (Proposed above.)

---

## Next Steps

1. Jimbo: create MiniText/MiniCode feature inventories + review sections 2,4,5,7.
2. Alice: review my proposed changes to sections 4,5,6,8,9,11,13.
3. All: discuss open decisions in GitHub issue #1.
4. Once agreed: finalize ARCHITECTURE.md on `integration/render` branch.
5. Begin Phase 1: minimal MiniRender foundation.

## Feature Inventory Status

| Module | Owner | Status |
|--------|-------|--------|
| MiniDiagram | Alice | Done (alice/spatial) |
| MiniMath | Alice | Done (alice/spatial) |
| MiniText | Jimbo | Pending |
| MiniCode | Jimbo | Pending |
| MiniChart | Cortana | Done (cortana/data) |
| MiniTable | Cortana | Done (cortana/data) |


---

## Appendix: Review of Jimbo's Proposals (Phase 0)

### 1. Measurement Contract Reconciliation

Jimbo proposed `Measurement { intrinsic, min, max?, baseline?, bbox }`. I proposed `MeasureResult { width, height, baseline?, minWidth?, ... }`. Reconciled: merge both, using Jimbo's structural approach with individual dimension fields.

### 2. Span Interface — Agree

Jimbo's `Span` interface is a good shared primitive. Extended slightly for chart/table use with optional `dataRef`.

### 3. StreamController — Agree, with data extension

Extended with `pushData` and `onBackpressure` for real-time chart/table updates.

### 4. IncrementalUpdate — Agree, with data extension

Extended with `changedData` for chart/table data indices.

### 5. TextMeasurer — Agree

Promoting to shared is essential for MiniChart/MiniTable too.

### 6. Oniguruma WASM Licensing — Needs Investigation

Critical blocker for standalone HTML. Proposed Option C (optional capability) as primary, Option A (inlined WASM) as fallback.

### 7. sanitizeHtml, TextProcessor, Typography — Agree

All should be shared MiniRender utilities.

### 8. Data/Virtualization/Interaction Concerns

Jimbo's streaming and incremental contracts affect MiniChart/MiniTable. Shared virtualization in MiniRender/virtualization/. Backpressure handling essential.

### 9. Open Decisions — Reconciled

All six decisions agreed. New decisions 7-10 proposed (virtualization location, backend fallback, RenderNode generic, MeasureResult baseline).

### 10. Licensing — Additional Verification Needed

Oniguruma (BSD) for Shiki. D3 submodules (BSD-3) for Recharts. jQuery (MIT) for DataTables. KaTeX fonts. Need comprehensive THIRD_PARTY_NOTICES.md in Phase 1.
