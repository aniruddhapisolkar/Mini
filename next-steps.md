# Mini — Next Steps (Remaining Work)

Reference for follow-up agents. State as of latest main: 264 tests passing, typecheck clean, zero runtime deps, ~236K bundled (tree-shakeable). All 6 modules implemented; not yet at full parity with inspirations.

## 1. MiniMath (Alice) — KaTeX parity (highest priority)

### Remaining commands/environments
- `\begin{CD}` commutative diagrams (KaTeX cd environment): @>>> / @<<< / @VVV / @AAA / @. arrows, grid layout.
- `\begin{subarray}` rendering polish (currently treated as array).
- `\begin{smallmatrix}` font-size reduction (currently same size).
- `\sideset` with proper left/right sub/sup placement.
- `\mathop`, `\mathbin`, `\mathrel`, etc. (currently no-ops; should change atom type).
- `\leftroot`, `\uproot` for root index positioning.
- `\surd` (sqrt symbol without vinculum).
- `\atop`, `\atopwithdelims`.
- `\choose`, `\brace`, `\brack` (binomial variants).
- `\pmod`, `\mod`, `\pod` full (currently partial).
- `\tag*` (unnumbered tag).
- `\nonumber`, `\notag`.
- `\label`, `\ref`, `\eqref` (cross-references).
- `\href` protocol/trust handling (currently renders <a>).
- `\includegraphics` width/height/totalheight/alt parsing (currently ignores opts).
- `\raisebox` full height/depth args (partially done).
- `\reflectbox` (done).
- `\smash` with [t]/[b] (currently ignores).
- `\phantom` variants (done).
- `\kern`, `\mkern`, `\mspace` (done).
- `\hfill`, `\hfil`, `\hfilll` (done).
- `\limits`, `\nolimits`, `\displaylimits` (done as no-ops).

### Font metrics (TeX font metrics)
- Current: per-glyph canvas width estimate + fixed 16px height.
- Needed: per-glyph height, depth, italic correction, skew, kerning from KaTeX font metrics (KaTeX_Main, KaTeX_Math, KaTeX_AMS, etc.).
- Approach: bundle font metric data (JSON) derived from KaTeX's fontMetrics.js; use for accurate layout.
- Affects: delimiter sizing, fraction bar thickness, accent positioning, spacing.

### Delimiter sizing
- Current: scaleY heuristic based on countTall.
- Needed: actual content height measurement; stretchy delimiters should match content height exactly.
- Approach: two-pass render or measure content height via DOM in browser; for SSR use font metrics.

### MathML output
- Add `<semantics>` with `<annotation encoding="application/x-tex">` (done).
- Improve parallel MathML structure (mrows, mfracs, etc.) for screen readers.
- Add `aria-label` with LaTeX source (done).

### mhchem (chemistry)
- Current: basic \ce with subscripts/superscripts.
- Needed: bonds (-, =, #, ~>, <~), arrows (->, <-, <=>), charges (^{2+}), states (^{aq}), complexes, isotopes, etc.
- Consider vendoring KaTeX's mhchem extension or reimplementing.

### Macros
- Current: \def, \newcommand, \renewcommand, \providecommand (basic string storage).
- Needed: argument substitution (#1..#9), \gdef/\xdef/\global persistence, \@ifstar, \@ifnextchar, \expandafter, \noexpand, \relax.
- Persistent macros between expressions (gdef).

### Incremental/streaming rendering
- Current: createMathStream (basic), update() (full re-render).
- Needed: IncrementalUpdate with changedRanges; patch DOM instead of rebuild; StreamController backpressure.

### Auto-render
- Current: renderMathInElement (basic).
- Needed: displayMode detection, processEscapes, delimiters config, preProcess.

### Copy-tex
- Current: data-latex attribute + MathML annotation.
- Needed: click-to-copy handler (optional, browser-side).

### Other missing KaTeX commands (from support table)
- \dddot, \ddddot (done)
- \mathring (done)
- \widecheck (done)
- \utilde (done)
- \overgroup, \undergroup (done)
- \Overrightarrow (done)
- \overbracket, \underbracket (done)
- \overlinesegment, \underlinesegment (done)
- \sout (done)
- \fcolorbox, \colorbox (done)
- \boxed (done)
- \href (done)
- \htmlClass, \htmlId, \htmlStyle, \htmlData (done)
- \includegraphics (basic)
- \raisebox (full)
- \reflectbox (done)
- \llap, \rlap, \clap (done)
- \smash (done)
- \phantom, \vphantom, \hphantom (done)
- \strut (done)
- \vcenter (done)
- \mathchoice, \mathpalette (done)
- \subarray (done)
- \sideset (basic)
- \stackrel, \overset, \underset (done)
- \xrightarrow, \xleftarrow (done)
- \overrightarrow, etc. (done)
- \operatorname, \operatorname* (done)
- \DeclareMathOperator (done)
- \mod, \pmod, \bmod, \pod (done)
- \atop, \choose, \brace, \brack
- \leftroot, \uproot
- \surd
- \textcircled
- \maltese, \minuso, etc. (misc symbols)
- \arraystretch
- \hline, \cline (done)
- \multicolumn (missing)
- \multirow (missing)
- \cline (done)
- \hdashline, \cdashline (dashed rules)
- \hphantom (done)

## 2. MiniDiagram (Alice) — more diagram types & features

### Missing diagram types (Mermaid 12.1.0)
- Class diagrams (done)
- State diagrams (done)
- ER diagrams (done)
- Sequence diagrams (done)
- Gantt charts (done)
- Pie charts (done)
- Mindmaps (done)
- Flowcharts (done)
- Git graphs
- Journey (user journey)
- Timeline
- Kanban
- Quadrant charts
- Sankey diagrams
- Treemaps
- XY charts
- Block diagrams
- C4 diagrams
- Requirement diagrams
- Activity/swimlane diagrams
- Use case diagrams
- Network diagrams
- Venn diagrams
- Wardley maps
- Architecture diagrams
- Dependency graphs

### Missing features
- Interactive diagrams (click, hover, drag, select, zoom/pan)
- Animations (entrance, path animation, transitions)
- Nested structures/subgraphs (basic)
- Edge routing (obstacle avoidance)
- Custom shapes
- Theming via CSS variables (basic)
- Accessibility (ARIA, keyboard nav, reduced motion)
- Export (PNG via shared export infra)
- Virtualization for large graphs
- Incremental update on small changes

## 3. MiniText (Jimbo) — CommonMark spec compliance

### Current: 379/652 (58%)
### Missing
- Raw HTML blocks (currently 10%)
- Block quotes (currently 0%)
- Fenced/indented code blocks (highlighting)
- Emphasis edge cases (flanking rules)
- Reference link definitions (done)
- Tables (GFM) (done)
- Task lists (done)
- Footnotes (done)
- Callouts (done)
- Setext headings (done)
- Autolinks (done)
- Strikethrough (done)
- Highlight (done)
- Superscript/subscript (done)
- Math inline (cross-module)
- Streaming rendering (interface done, implementation partial)
- Incremental rendering (partial)

## 4. MiniCode (Jimbo) — language coverage & features

### Missing
- Full CommonMark spec harness for code blocks
- More languages (currently 30+; target 100+)
- Nested/embedded languages
- Code folding
- Code diffs (done basic)
- Line highlighting (done)
- Token annotations
- Copying/selection
- Interactive code blocks
- Incremental tokenization
- Streaming code rendering

## 5. MiniChart (Cortana) — remaining

### Missing
- Animations (partial: CSS transitions added)
- Zooming/panning
- Real-time data updates
- Large dataset optimization
- Financial charts (candlestick, OHLC)
- Heatmaps
- Box plots
- Histograms
- Radar (done), bubble (done)
- Mixed charts (done), stacked bars (done), polarArea (done)
- Multiple axes/scales (done basic)
- Logarithmic scales
- Tooltips (done)
- Legend positioning (done)
- Responsive sizing (done)
- Dark mode via CSS vars (done)
- Pie percentage labels (done)
- Grid lines (done), axis labels (done)
- Canvas backend (done)
- Percentage labels (done)

## 6. MiniTable (Cortana) — remaining

### Missing
- Column reordering (drag) (done basic)
- Column pinning
- Hierarchical rows
- Expandable rows (done)
- Row/cell selection (done)
- Editable cells (done)
- Custom cell renderers
- Streaming data
- Reactive updates
- Data import/export
- Keyboard navigation
- Embedded content from other Mini modules
- Scrollable virtualization + rAF scroll handler (done)
- Column resize drag (done)
- Aggregation, footer, highlightFilter (done)
- Grouping, column visibility/ordering (done)
- Dark mode via CSS vars (done)

## 7. MiniRender (shared) — remaining

### Missing
- Canvas backend (done)
- WebGL backend
- Resource management (done basic)
- Scheduling (done basic)
- Caching (done basic)
- Event handling
- Export (PNG, PDF, SVG, JSON) — partial
- Accessibility (ARIA, keyboard, screen reader)
- Security (sanitization, CSP)
- Profiling/diagnostics
- Incremental rendering
- Recursive composition (basic)
- Serialization

## 8. Size optimization

- Current: 236K bundled total (tree-shakeable).
- Target: reduce further via lazy loading of diagram types, language grammars, chart types.
- Lazy grammar loading for MiniCode (done basic).
- Lazy diagram type registration for MiniDiagram.
- Font subsetting for MiniMath (KaTeX fonts).
- Remove unused code paths.

## 9. Speed optimization

- Benchmarks exist (npm run bench) but not executed in CI.
- MiniText parse: 266K ops/sec (small docs).
- Need: benchmark execution, profiling, optimization of hot paths.
- Incremental rendering for MiniText (done basic).
- Virtualization for large tables (done).

## 10. Documentation

- MiniMath docs.md (done), README (done), COMPATIBILITY.md (done).
- MiniDiagram README (done).
- MiniChart docs.md (done), MiniTable docs.md (done).
- MiniText docs (done), MiniCode docs (done).
- Need: API reference, examples, migration guides.

## 11. Testing

- 264 tests passing (9 test files).
- Need: full CommonMark spec harness (currently 379/652 = 58%).
- KaTeX compatibility tests against KaTeX test corpus.
- Cross-module integration tests (beyond registration).
- Visual regression tests.
- Accessibility tests.

## 12. Licensing

- Per-asset licensing verification pending: KaTeX fonts, grammars, Oniguruma WASM, D3 submodules.
- THIRD_PARTY_NOTICES.md created.

## Priority order for next agents

1. Full KaTeX parity (Alice) — most impactful for correctness.
2. CommonMark spec compliance (Jimbo) — 379/652 → 652/652.
3. Full MiniDiagram diagram types (Alice) — expand beyond flowchart/sequence/mindmap/pie/gantt/state/ER/class.
4. Full MiniChart/MiniTable features (Cortana) — animations, grouping, keyboard nav, import/export.
5. MiniRender completion (shared) — WebGL, events, export, accessibility.
6. Size/speed optimization (all) — lazy loading, font subsetting, profiling.
7. Documentation (all) — API reference, examples.
8. Licensing verification (all).

## Notes for agents
- Work on dedicated branches; use PRs for integration.
- Run `npm run typecheck` and `npm run test` before submitting.
- Do not add more tests unless they verify new functionality (user directive: focus on functionality, speed, size).
- Coordinate via channel; do not work in silos.
- The user wants autonomous work; do not stop for partial progress.
