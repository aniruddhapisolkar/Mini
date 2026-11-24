# MINI — MASTER ENGINEERING DIRECTIVE

**Alice, Jimbo, and Cortana — you guys are going to work together to build Mini.**

You will each be responsible for two specialized rendering modules. Once those modules are substantially developed, you will work together to complete the unified rendering engine.

Read this entire directive before beginning. You need to understand the complete vision, architecture, requirements, and responsibilities of the project—not just your individual assignments.

# 1. The Vision

**Minimal Size. Maximum Capability. Extreme Performance.**

Mini is a unified, ultra-fast, lightweight, comprehensive rendering library for the web.

The objective is to achieve three things simultaneously:

- **Minimal size** — Minimal source complexity, dependencies, distribution size, and memory consumption.
- **Maximum functionality** — Match and exceed the capabilities of established rendering libraries.
- **Extreme performance** — Exceptional initialization speed, rendering speed, responsiveness, throughput, and computational efficiency.

None of these objectives may be sacrificed to artificially improve another.

I do not want Mini to be lightweight because it lacks functionality. I want it to be lightweight because it is exceptionally well engineered.

For example, MiniMath MUST be able to render everything that KaTeX can render, and more. Removing functionality to reduce bundle size is unacceptable.

Apply this philosophy throughout the entire project.

**The objective is not to implement less. The objective is to achieve more with less.**

# 2. Project Architecture

Mini is **one library with one unified rendering engine and six specialized modules**.

The seven principal components are:

1. MiniDiagram
2. MiniText
3. MiniMath
4. MiniCode
5. MiniChart
6. MiniTable
7. MiniRender

Each specialized module must be independently consumable. However, internally, all six modules must operate as part of the same architectural system and use the same underlying rendering engine.

Do not build six unrelated libraries and attempt to glue them together afterward.

Build one cohesive system with specialized parsers, semantic models, layout algorithms, rendering capabilities, and shared infrastructure.

The conceptual architecture is:

```text
                         Mini
                           │
    ┌──────────┬───────────┼───────────┬──────────┐
    │          │           │           │          │
 Diagram      Text        Math        Code      Chart     Table
    │          │           │           │          │         │
    └──────────┴───────────┴─────┬─────┴──────────┴─────────┘
                                 │
                            MiniRender
                                 │
                  ┌──────┬───────┴───────┬───────┐
                 HTML   SVG           Canvas   WebGL
```

The rendering engine must provide common infrastructure without unnecessarily absorbing domain-specific logic.

Every module must be usable independently, with consumers paying only for the functionality they use.

# 3. Individual Assignments

## Alice — MiniDiagram and MiniMath

Alice, here's what you need to do.

You are responsible for the spatial, geometric, and mathematical rendering capabilities of Mini.

### MiniDiagram

Primary reference: Pele (https://pele.run).

Additional references: Mermaid and other established diagramming libraries.

Study Pele's source, syntax, architecture, aesthetics, and rendering approach.

I want to preserve Pele's exceptional simplicity and visual elegance while substantially expanding its functionality.

MiniDiagram should support:

- Flowcharts
- Directed and undirected graphs
- Mind maps
- Sequence diagrams
- State diagrams
- Class diagrams
- Entity-relationship diagrams
- Architecture diagrams
- Dependency graphs
- Trees and hierarchies
- Workflows
- Network visualizations
- Custom diagram types
- Automatic and manual layouts
- Nested structures
- Custom shapes and connectors
- Edge routing
- Labels and annotations
- Interactive diagrams
- Animations
- Cross-module content embedding

Develop an elegant, lightweight, declarative syntax that makes simple diagrams exceptionally easy to write while remaining powerful enough for complex diagrams.

The default visual output should be aesthetically exceptional.

### MiniMath

Primary reference: KaTeX (https://katex.org).

Additional references: established mathematical typesetting and mathematical visualization libraries.

MiniMath has two equally important responsibilities.

**Mathematical typesetting**

MiniMath MUST achieve complete functional parity with the selected KaTeX reference version and subsequently exceed it.

This includes every supported:

- Command
- Environment
- Symbol
- Macro
- Delimiter
- Alignment rule
- Spacing rule
- Sizing behavior
- Font and typographic feature
- Configuration option
- Relevant rendering behavior

Do not implement a convenient subset of LaTeX.

Study KaTeX's implementation, documentation, supported-function inventory, assets, and test corpus.

Establish a comprehensive compatibility matrix and verify MiniMath against it.

Preserve mathematical correctness, visual fidelity, accessibility, and rendering quality.

**Mathematical illustration**

Develop an original declarative mathematical illustration language.

I want something as simple and aesthetically refined as Pele, but powerful enough to illustrate practically any mathematical concept.

The language should support:

- Coordinate systems
- Function plots
- Parametric curves
- Polar plots
- Implicit curves
- Piecewise functions
- Geometric constructions
- Euclidean geometry
- Vectors
- Vector fields
- Scalar fields
- Complex-plane visualizations
- Matrix transformations
- Linear transformations
- Linear algebra illustrations
- Calculus illustrations
- Limits and convergence
- Derivatives and integrals
- Differential equations
- Probability distributions
- Statistical illustrations
- Mathematical graphs and networks
- Three-dimensional geometry
- Surfaces and volumes
- Mathematical animations
- Interactive mathematical models
- Custom mathematical objects
- Symbolic annotations
- Composable mathematical scenes

Simple mathematical illustrations should require very little code. Complex illustrations must remain possible without restrictive abstractions or awkward workarounds.

Mathematical typesetting and mathematical illustrations must integrate seamlessly.

You should also establish reusable geometry, coordinate transformation, spatial layout, and graphical primitives where they benefit the shared rendering engine.

## Jimbo — MiniText and MiniCode

Jimbo, here's what you need to do.

You are responsible for the textual, linguistic, semantic, and source-code rendering capabilities of Mini.

### MiniText

Primary references: Markdown, CommonMark, GitHub Flavored Markdown, and established rich-text rendering systems.

Build a comprehensive Markdown and structured-document rendering system.

MiniText should support:

- Complete CommonMark compatibility
- GitHub Flavored Markdown
- Extended Markdown syntax
- Structured documents
- Typography
- Footnotes and references
- Tables
- Task lists
- Callouts and admonitions
- Nested content
- Custom document components
- Embedded HTML with appropriate security controls
- Streaming rendering
- Incremental rendering
- Extensible syntax
- Cross-module content embedding

MiniText should be capable of powering sophisticated technical documents, scientific publications, interactive documentation, and note-taking applications.

Pay particular attention to parsing correctness, ambiguous syntax, deeply nested structures, large documents, incremental updates, and streaming performance.

Markdown documents should be capable of naturally embedding diagrams, mathematical equations, mathematical illustrations, charts, tables, and syntax-highlighted code.

Do not implement embedding through brittle string replacement.

### MiniCode

Primary references: Shiki (https://shiki.style) and Prism (https://prismjs.com).

Build a comprehensive source-code rendering system.

MiniCode should support:

- Syntax highlighting
- Comprehensive programming-language coverage
- Language grammars
- Nested languages
- Embedded languages
- Custom grammars
- Themes
- Inline code
- Multiline code blocks
- Line numbering
- Line highlighting
- Token annotations
- Code diffs
- Code folding
- Code formatting through appropriate language-specific implementations
- Copying and selection
- Interactive code blocks
- Incremental tokenization
- Streaming code rendering
- Extensible language support

Study the strengths and weaknesses of both Shiki and Prism.

Achieve excellent highlighting accuracy without forcing consumers to load every programming-language grammar simultaneously.

Language grammars and themes should be selectively loadable.

Rendering code must not implicitly execute it. Any future execution capabilities must be explicitly isolated and secured.

You should also establish reusable parsing utilities, token representations, text-processing primitives, and typography infrastructure where they benefit the shared rendering engine.

## Cortana — MiniChart and MiniTable

Cortana, here's what you need to do.

You are responsible for data visualization, structured data, interactive rendering, and high-volume data processing.

### MiniChart

Primary references: Chart.js (https://www.chartjs.org) and Recharts (https://recharts.org).

Additional references: established scientific and interactive data visualization libraries.

Build a comprehensive charting system.

MiniChart should support:

- Line charts
- Bar charts
- Area charts
- Scatter plots
- Bubble charts
- Pie charts
- Doughnut charts
- Histograms
- Box plots
- Heatmaps
- Radar charts
- Financial charts
- Time-series visualizations
- Statistical visualizations
- Stacked and grouped charts
- Mixed charts
- Custom chart types
- Multiple axes
- Multiple scales
- Logarithmic scales
- Legends
- Tooltips
- Zooming and panning
- Animations
- Interactive data exploration
- Real-time data updates
- Large datasets
- Responsive dashboards
- Declarative and programmatic specifications

MiniChart must support everything from straightforward static visualizations to sophisticated, interactive data applications.

Pay particular attention to rendering performance, efficient data transformations, large datasets, incremental updates, coordinate transformations, and backend selection.

### MiniTable

Primary references: TanStack Table (https://tanstack.com/table) and DataTables (https://datatables.net).

Build a comprehensive table and data-grid rendering system.

MiniTable should support:

- Static tables
- Interactive tables
- Sorting
- Filtering
- Searching
- Pagination
- Row virtualization
- Column virtualization
- Column resizing
- Column reordering
- Column pinning
- Grouping
- Aggregation
- Hierarchical rows
- Expandable rows
- Row and cell selection
- Editable cells
- Custom cell renderers
- Large datasets
- Streaming data
- Reactive updates
- Responsive layouts
- Data import and export
- Keyboard navigation
- Embedded content from other Mini modules

MiniTable should support everything from simple Markdown tables to advanced interactive data grids.

Do not impose the overhead of an interactive data grid on a simple static table.

You should also establish reusable data-processing utilities, virtualization algorithms, reactive update mechanisms, and interaction primitives where they benefit the shared rendering engine.

# 4. MiniRender — Shared Responsibility

Alice, Jimbo, and Cortana, all three of you are responsible for MiniRender.

MiniRender is the single unified rendering engine powering the entire library.

Its responsibilities include:

- Rendering lifecycle
- Shared rendering interfaces
- Render tree representation
- Composition
- Module registration
- Backend abstraction
- Layout orchestration
- Rendering primitives
- Resource management
- State management
- Event handling
- Incremental updates
- Invalidation
- Scheduling
- Caching
- Memory management
- Cross-module embedding
- Serialization
- Export infrastructure
- Accessibility
- Security
- Diagnostics
- Profiling

Cortana, you will also serve as the integration coordinator unless I specify otherwise.

That does not give you unilateral control over architectural decisions. Your responsibility is to coordinate shared changes, resolve architectural conflicts, and ensure that the final implementation behaves as one coherent library.

You guys must collectively establish the architectural contracts before developing your modules independently.

Do not wait until all six modules are complete to figure out how they should communicate with MiniRender.

Establish a minimal shared foundation first. Build your assigned modules against that foundation. Then return together to complete and optimize the engine.

# 5. GitHub Repository

I have created a GitHub repository named `Mini`.

I will establish seven primary directories, one for each specialized module and one for MiniRender.

The intended structure is:

```text
Mini/
├── MiniDiagram/
├── MiniText/
├── MiniMath/
├── MiniCode/
├── MiniChart/
├── MiniTable/
├── MiniRender/
├── AGENTS.md
├── ARCHITECTURE.md
├── README.md
├── LICENSE
├── package.json
└── tsconfig.json
```

Use the actual directory names I establish.

Additional directories for tests, benchmarks, documentation, examples, and development tooling may be introduced when justified.

Keep the repository exceptionally clean and organized.

Do not introduce unnecessary files, directories, packages, or organizational layers.

Alice, you primarily own `MiniDiagram/` and `MiniMath/`.

Jimbo, you primarily own `MiniText/` and `MiniCode/`.

Cortana, you primarily own `MiniChart/` and `MiniTable/`.

All three of you share responsibility for `MiniRender/` and root-level architectural decisions.

# 6. Rendering Architecture

The conceptual rendering pipeline should be:

```text
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
Rendering Backend
```

This is a conceptual architecture, not a requirement that every operation must allocate an AST, intermediate representation, or render tree.

You guys should implement specialized fast paths, streaming paths, incremental processing, lazy evaluation, and direct rendering where appropriate.

Do not introduce unnecessary intermediate representations, allocations, conversions, or abstraction layers.

The architecture must support:

- HTML
- SVG
- Canvas
- WebGL

HTML and SVG should be the initial general-purpose backends.

Canvas and WebGL should be employed where they provide measurable advantages, particularly for complex graphics, large datasets, and mathematical visualizations.

Do not force every module to support every backend when doing so compromises correctness, accessibility, functionality, or performance.

Each module must retain ownership of its specialized algorithms.

MiniRender should provide common infrastructure wherever the semantics genuinely align.

Avoid duplication of rendering infrastructure, resource management, event systems, scheduling, caching, and common utilities.

However, do not introduce premature abstractions merely because two implementations appear superficially similar.

# 7. Specialized Syntaxes

Mini will NOT use one universal rendering language.

Each module will use a specialized syntax appropriate to its domain.

| Module | Syntax |
|---|---|
| MiniDiagram | Declarative diagram DSL |
| MiniText | Markdown and Markdown extensions |
| MiniMath | LaTeX and mathematical illustration DSL |
| MiniCode | Native programming languages and configuration |
| MiniChart | Declarative chart DSL and JS/JSON specifications |
| MiniTable | Markdown tables and JS/JSON specifications |
| MiniRender | Unified composition and rendering API |

Preserve compatibility with existing standards and familiar syntaxes wherever practical.

For newly designed languages, prioritize:

- Simplicity
- Readability
- Expressiveness
- Composability
- Orthogonality
- Customizability
- Predictable semantics
- Efficient parsing
- Useful error messages

Simple things should be simple to express. Complex things should remain possible.

Never achieve syntactic simplicity by unnecessarily restricting expressive power.

# 8. Native Cross-Module Composition

Cross-module interoperability is a fundamental requirement, not an optional extension.

I want to be able to render:

- Mathematical equations inside diagrams.
- Mathematical illustrations inside Markdown documents.
- Charts inside tables.
- Syntax-highlighted code inside diagrams.
- Mathematical equations inside chart labels.
- Diagrams inside interactive table cells.
- Rich-text annotations inside mathematical illustrations.
- Complete interactive documents containing all six modules.

MiniRender must support recursive composition, nested rendering, layout negotiation, event propagation, scoped styles, resource reuse, and lifecycle management.

Establish a consistent mechanism for module discovery, embedded content, measurement, rendering, updating, and disposal.

Handle missing modules, invalid input, cyclic references, excessive nesting, and rendering failures gracefully.

Do not introduce circular dependencies between modules.

The integration must feel native rather than like six separate libraries being forced to communicate.

# 9. Implementation Philosophy

You guys will follow a **selectively derived implementation strategy**.

I do not want you to blindly fork existing libraries.

I also do not want you to unnecessarily reinvent decades of proven engineering.

Study established implementations and selectively derive useful:

- Algorithms
- Data structures
- Parsing techniques
- Grammar definitions
- Layout strategies
- Rendering techniques
- Optimization techniques
- Compatibility tests
- Mathematical implementations

Reuse mature implementations where appropriate and legally permitted.

Rewrite infrastructure that is inefficient, unnecessarily complex, or incompatible with Mini's unified architecture.

Do not simply bundle Pele, KaTeX, Shiki, Prism, Chart.js, Recharts, TanStack Table, and DataTables together.

Mini must possess its own cohesive architecture.

Before incorporating external source code, fonts, assets, grammars, or tests, verify licensing compatibility and redistribution requirements.

Maintain a record of upstream sources, pinned reference versions or commits, modifications, attribution, and applicable licenses.

Never remove legally required notices in pursuit of smaller files.

# 10. Functional Completeness

**Functional completeness is non-negotiable.**

Mini is intended to compete with mature rendering libraries, not merely provide simplified alternatives.

Each of you must:

1. Identify and pin the appropriate upstream reference libraries.
2. Establish comprehensive inventories of their relevant functionality.
3. Create feature and compatibility matrices.
4. Identify necessary standards and behavioral requirements.
5. Implement equivalent functionality.
6. Verify compatibility through comprehensive testing.
7. Extend beyond the established baseline.
8. Document unresolved differences transparently.

Alice, MiniMath must achieve full KaTeX compatibility. That is an explicit acceptance requirement.

Jimbo, MiniText and MiniCode must achieve comprehensive standards and reference-library compatibility.

Cortana, MiniChart and MiniTable must match the applicable functionality of their established reference libraries.

All three of you must subsequently extend your modules beyond those baselines.

Any proposed functional exclusions, incompatibilities, or scope reductions require explicit justification and my approval.

Do not silently omit difficult features.

Do not substitute superficial visual approximations for correct implementations.

Do not claim feature parity without verifying it.

You may implement functionality progressively throughout development, but progressive implementation does not justify a reduced final feature set.

# 11. Size Optimization

Mini must be exceptionally lightweight without compromising functionality.

Achieve small distribution sizes through superior engineering:

- Shared infrastructure
- Efficient algorithms
- Compact data representations
- Elimination of redundant code
- Tree shaking
- Dead-code elimination
- Minification
- Compression
- Selective imports
- Optional capability loading
- Modular language grammars
- Efficient font and asset packaging
- Lazy initialization
- Build-time transformations
- Careful dependency management

Target zero external runtime dependencies.

Development-time dependencies are acceptable when justified.

Any necessary external runtime dependency must be evaluated for its functionality, performance, size, security, licensing, and maintenance implications.

Measure and distinguish between:

- Minimum independently usable module size
- Full-featured module size
- Incrementally loaded capability size
- Shared engine size
- Complete ecosystem size
- Uncompressed distribution size
- Gzip-compressed distribution size
- Brotli-compressed distribution size
- Required fonts and other assets

Optional loading does NOT mean optional implementation.

All advertised functionality must actually exist.

Do not manipulate bundle-size measurements by excluding required resources, hiding dependencies, or comparing implementations with unequal functionality.

For example, someone rendering a basic LaTeX equation should not have to load an entire 3D mathematical visualization system.

However, that 3D mathematical visualization system must still exist and work.

The complete distribution must contain the complete functionality.

**Maximum capability. Minimum mandatory footprint.**

# 12. Extreme Performance

Performance must be objectively measurable.

Optimize:

- Cold initialization
- Warm initialization
- Parsing latency
- Tokenization throughput
- Layout computation
- Initial rendering
- Incremental rendering
- DOM operations
- Browser layout and paint costs
- Memory allocation
- Garbage collection pressure
- Cache efficiency
- Animation smoothness
- Interaction latency
- Large-document processing
- Large-dataset processing
- Streaming updates
- Backend selection
- Resource disposal

Prioritize appropriate algorithms and data structures before micro-optimizations.

Investigate unnecessary allocations, repeated computations, redundant DOM operations, layout thrashing, excessive serialization, and expensive abstractions.

Use caching, typed arrays, memoization, virtualization, pooling, and worker-based computation where justified by actual performance requirements.

You guys must establish reproducible benchmarks against your respective reference libraries.

Compare equivalent functionality, input complexity, output quality, rendering conditions, and required assets.

Measure cold and warm performance separately.

Record the benchmark environment, methodology, results, variance, and limitations.

Establish explicit size and performance targets after measuring upstream baselines.

Do not fabricate benchmark results.

Do not claim superiority without supporting measurements.

Do not introduce optimizations that compromise functionality or correctness.

# 13. Public API

Mini should expose an intuitive, consistent, TypeScript-first public API.

The following examples illustrate the intended direction. You guys must collectively establish the final API signatures.

**Unified library:**

```ts
import Mini from "mini";

Mini.math.render(latex, container);
Mini.diagram.render(source, container);
Mini.text.render(markdown, container);
Mini.code.render(source, options, container);
Mini.chart.render(specification, container);
Mini.table.render(data, container);
```

**Unified rendering interface:**

```ts
Mini.render("math", latex, container);
Mini.render("diagram", source, container);
Mini.render("text", markdown, container);
```

**Programmatic composition:**

```ts
Mini.compose([
    Mini.text(markdown),
    Mini.math(latex),
    Mini.diagram(diagram),
    Mini.chart(specification)
]);
```

**Selective module imports:**

```ts
import { math } from "mini/math";
import { diagram } from "mini/diagram";
import { render } from "mini/render";
```

Each module should remain independently consumable without duplicating the underlying rendering infrastructure.

The entire library must be framework-agnostic.

Support Vanilla JavaScript, React, Vue, Svelte, and other environments without requiring any particular framework.

Framework adapters may be provided separately where justified.

# 14. Distribution and Standalone HTML Compatibility

One of my primary intended use cases for Mini is my standalone HTML note-taking application.

My application is distributed as a single HTML file containing its own JavaScript, CSS, and other necessary resources.

I currently have the entire KaTeX library embedded within that HTML file.

I want to be able to do the same thing with Mini.

Therefore, you guys must treat standalone distribution as a first-class architectural requirement.

Mini must support:

- TypeScript declarations
- ES modules
- Tree-shakeable entry points
- Independently consumable modules
- Minified browser bundles
- A complete standalone browser bundle
- Selectively generated standalone bundles

The complete standalone browser distribution must be capable of operating:

- Inside a single HTML file.
- Without a package manager.
- Without a consumer-side build step.
- Without external network requests.
- Without external CDNs.
- Without a local server.
- Without mandatory dynamic imports from external files.
- Completely offline.

All required fonts, grammars, styles, and assets must be embeddable within the same HTML file.

The standalone distribution must not silently depend on resources that are absent from that file.

Users must be able to generate either a complete distribution containing every capability or a custom distribution containing only selected capabilities.

Measure standalone distribution sizes separately from modular distribution sizes.

# 15. Universal Environment Support

Where technically applicable, Mini should support:

- Modern web browsers
- Server-side environments
- Server-side rendering
- Static-site generation
- Web Workers
- Streaming environments
- Offline applications

Separate computation from platform-dependent rendering where beneficial.

Parsing, semantic processing, geometry, and other suitable computations should remain independent of browser-specific APIs.

Do not require browser globals merely to import a module.

Document which capabilities require a DOM, graphics context, font measurement, or other platform-specific functionality.

# 16. Extensibility and Customization

Mini must support appropriately scoped extension mechanisms for:

- Custom renderers
- Syntax extensions
- Diagram types
- Mathematical objects
- Language grammars
- Chart types
- Table cell renderers
- Themes
- Styles
- Layout algorithms
- Rendering backends
- Export formats

Customization should be powerful without requiring developers to understand the entire internal architecture.

Provide aesthetically refined defaults.

The default rendering quality should be exceptional without requiring extensive configuration.

Keep the library independent of any specific application's design system.

Make Mini responsive, customizable, and extensible without introducing unnecessary mandatory overhead.

# 17. Security, Accessibility, and Correctness

You guys must treat security, accessibility, and correctness as fundamental engineering requirements.

Address:

- Untrusted input
- HTML and SVG sanitization
- Cross-site scripting
- Unsafe URLs
- Prototype pollution
- Arbitrary code execution
- Resource exhaustion
- Maliciously complex inputs
- Excessive recursion
- Content Security Policy compatibility
- Keyboard navigation
- Semantic HTML
- ARIA
- Accessible mathematical representations
- Accessible alternatives for graphical output
- Screen-reader compatibility
- Reduced-motion preferences

Do not use `eval`, unsafe dynamic execution, or unrestricted HTML injection as convenient shortcuts.

Ensure deterministic rendering where appropriate.

Handle malformed input gracefully.

Provide structured diagnostics that identify the source location and nature of errors whenever possible.

# 18. Export and Serialization

Mini should support relevant export formats, including:

- HTML
- SVG
- PNG
- PDF
- JSON

Not every format is appropriate for every module or rendering backend.

Document export capabilities, fidelity, limitations, and additional requirements.

Prefer native platform functionality and shared export infrastructure where appropriate.

Provide serializable document, visualization, and configuration representations wherever useful.

# 19. Engineering Standards

The entire codebase must be:

- TypeScript-first
- Strongly typed
- Readable
- Maintainable
- Modular
- Deterministic where appropriate
- Testable
- Well documented
- Efficient

Follow these engineering principles:

- Quality over quantity.
- Correctness before optimization.
- Simple solutions before complicated ones.
- Composition before unnecessary inheritance.
- Avoid unnecessary classes.
- Avoid unnecessary abstraction layers.
- Avoid circular dependencies.
- Avoid duplicated logic.
- Avoid excessive file fragmentation.
- Avoid speculative infrastructure.
- Avoid premature generalization.
- Avoid unnecessary runtime allocations.
- Avoid dependencies that provide little value.
- Comment non-obvious decisions rather than obvious code.

Every abstraction must earn its existence.

Every dependency must earn its existence.

Every byte must earn its existence.

Minimal file count is a preference, not an excuse to create unmaintainable monolithic source files.

Maintain a clear distinction between minimal source complexity and minimal distribution size.

# 20. Multi-Agent Collaboration

You guys are working on the same project.

Act accordingly.

## Shared source of truth

The GitHub repository is your shared source of truth.

Maintain:

- `AGENTS.md` — Project-wide engineering directives.
- `ARCHITECTURE.md` — Shared architecture, contracts, interfaces, and decisions.
- `README.md` — Project overview and usage.
- Feature inventories — Required functionality and implementation status.
- Decision records — Important architectural decisions and rationale.
- Benchmark results — Verified performance measurements.

Do not assume that the other agents have access to your private conversations, uncommitted work, or local environment.

Communicate through actual repository changes, documented decisions, issues, and pull requests.

## Git workflow

Work on dedicated branches.

Suggested branches:

```text
main
alice/spatial
jimbo/semantic
cortana/data
integration/render
```

Each of you must:

- Inspect the repository before beginning.
- Review existing architectural decisions.
- Synchronize relevant upstream changes.
- Keep commits focused and descriptive.
- Avoid overwriting another agent's work.
- Avoid force-pushing shared branches.
- Coordinate modifications to shared files.
- Review relevant changes from the other agents.
- Run applicable tests before submitting changes.
- Use pull requests for review and integration.
- Resolve conflicts without discarding valid implementations.

Do not independently modify another agent's assigned modules without coordination or a clearly documented integration requirement.

## Architectural conflicts

If any of you discovers that a shared contract is inadequate:

1. Document the problem.
2. Explain its technical consequences.
3. Propose a solution.
4. Evaluate the impact across all six modules.
5. Coordinate the change with the others.
6. Update the shared specification.
7. Implement the agreed change.

Do not silently introduce incompatible architectural decisions.

Do not create parallel versions of shared infrastructure merely to bypass coordination.

Do not claim that the other agents have agreed to a decision unless their agreement is actually recorded.

If direct communication with another agent is unavailable, document the proposal in the repository and identify any work blocked by that decision. Continue with non-conflicting work where possible.

# 21. Development Roadmap

## Phase 0 — Research and Architectural Agreement

All three of you will begin here.

Collaboratively establish:

- Upstream implementation research
- Licensing analysis
- Feature inventories
- Compatibility requirements
- Shared architecture
- Public API conventions
- Internal interfaces
- Module registration
- Rendering primitives
- Composition contracts
- Backend interfaces
- Layout and measurement contracts
- Lifecycle management
- Error handling
- Security requirements
- Testing infrastructure
- Build configuration
- Performance methodology
- Distribution requirements

Record the agreed decisions in `ARCHITECTURE.md`.

Do not begin substantial independent implementation before establishing the shared architectural contracts.

## Phase 1 — Minimal MiniRender Foundation

Together, establish a minimal functional rendering foundation.

Include only what is necessary to support parallel module development:

- Core interfaces
- Module registration
- Basic rendering lifecycle
- Backend contracts
- Shared primitives
- Basic composition
- Testing and benchmarking foundations

Create small reference implementations demonstrating that the contracts work across different rendering domains.

Do not attempt to complete the entire rendering engine at this stage.

## Phase 2 — Parallel Module Development

Now divide the work.

**Alice**, develop MiniDiagram and MiniMath.

**Jimbo**, develop MiniText and MiniCode.

**Cortana**, develop MiniChart and MiniTable.

Build your assigned modules against the agreed shared architecture.

Each module must include:

- Implementation
- Compatibility tests
- Unit tests
- Integration tests
- Feature inventories
- Documentation
- Usage examples
- Benchmarks

Develop functionality progressively while preserving the complete intended feature scope.

Periodically synchronize shared architectural changes.

## Phase 3 — Unified MiniRender Development

Once the six modules have established substantial functional implementations, all three of you will return to MiniRender.

Together, complete:

- Cross-module composition
- Recursive embedding
- Shared resource management
- Backend coordination
- Unified lifecycle management
- Reactive updates
- Incremental rendering
- Shared scheduling
- Shared caching
- Memory optimization
- Event propagation
- Consistent public interfaces
- Export integration
- Unified distribution

Eliminate unnecessary duplication discovered during module development.

Ensure that the entire ecosystem behaves as one cohesive library.

## Phase 4 — Functional Completeness

Audit your respective modules against their feature inventories and selected upstream references.

Complete all missing required functionality.

Resolve incompatibilities.

Verify mathematical correctness, rendering fidelity, syntax compatibility, and behavioral correctness.

Expand Mini beyond its established reference libraries.

Do not declare this phase complete while required functionality remains unimplemented.

## Phase 5 — Extreme Optimization

Together, profile the complete ecosystem.

Identify actual performance bottlenecks.

Optimize:

- Algorithms
- Rendering paths
- Memory usage
- Dependency footprint
- Distribution sizes
- Initialization
- Incremental operations

Run regression tests after every consequential optimization.

Reject optimizations that break required functionality or reduce output correctness.

Compare Mini with established alternatives using reproducible benchmarks.

## Phase 6 — Hardening and Release

Complete:

- Security auditing
- Accessibility auditing
- Cross-browser testing
- Environment compatibility testing
- Stress testing
- Fuzz testing where applicable
- Visual regression testing
- Documentation
- API references
- Example applications
- Distribution builds
- Standalone HTML integration
- License compliance
- Final compatibility audits
- Final performance audits

The objective is a production-grade release, not merely a successful demonstration.

# 22. Definition of Done

Your modules are not complete simply because they render common examples.

Completion requires:

- All required functionality implemented.
- Reference compatibility verified.
- Correctness tests passing.
- Cross-module composition working.
- Public APIs documented.
- Security requirements satisfied.
- Accessibility requirements satisfied.
- Performance measured.
- Bundle size measured.
- Resource usage measured.
- Distribution formats working.
- Standalone usage supported.
- Relevant edge cases tested.
- Known limitations explicitly documented.
- No unjustified loss of functionality.

Alice, specifically, you must demonstrate full compatibility with the selected KaTeX reference version before declaring MiniMath's mathematical typesetting implementation complete.

The same standard of comprehensive verification applies to the relevant references for every other module.

Mini itself is complete only when all six modules and MiniRender satisfy their respective acceptance requirements.

# 23. Reporting Requirements

At the conclusion of each substantial development milestone, each of you must report:

- Work completed.
- Files created or modified.
- Architectural decisions.
- Features implemented.
- Tests executed and their actual results.
- Verified benchmark results.
- Distribution size measurements.
- Known bugs and limitations.
- Remaining functionality.
- Integration requirements.
- Risks and unresolved decisions.
- Recommended next steps.

Clearly distinguish between implemented, tested, verified, planned, and incomplete functionality.

Do not fabricate results.

Do not assume another agent has completed work.

Do not claim successful execution of commands you did not actually execute.

If repository access, permissions, missing tools, unavailable dependencies, or coordination requirements prevent progress, document the blocker precisely.

# 24. Begin

Alice, begin researching Pele, KaTeX, and relevant mathematical visualization and diagramming implementations.

Jimbo, begin researching CommonMark, GFM, Shiki, Prism, and relevant textual rendering implementations.

Cortana, begin researching Chart.js, Recharts, TanStack Table, DataTables, and relevant data visualization implementations.

All three of you should first inspect the Mini repository, its seven component directories, existing files, and available development environment.

Establish comprehensive feature inventories for your respective modules.

Evaluate upstream architectures, algorithms, performance characteristics, dependencies, assets, compatibility requirements, and licensing.

Then collectively establish the shared architectural contracts and minimal MiniRender foundation.

Once that foundation is established, proceed with your assigned modules according to the development roadmap.

Work autonomously within the established requirements.

Do not spend unnecessary time producing speculative plans when concrete, verified engineering work is possible.

Escalate consequential decisions that materially alter project scope, compatibility, licensing, security, or architecture.

Do not rush implementation at the expense of architectural integrity.

# 25. Final Directive

You guys are not building a toy library.

You are not building simplified clones of existing libraries.

You are not building a collection of convenient rendering utilities.

You are building a comprehensive, production-grade rendering ecosystem intended to deliver exceptional functionality through a remarkably efficient architecture.

I want Mini to be small, not limited.

I want Mini to be fast, not incomplete.

I want Mini to be powerful, not bloated.

Never confuse minimalism with limitation.

Never confuse complexity with capability.

Never confuse premature completion with engineering excellence.

The objective is not to implement less.

The objective is to achieve more with less.

**MINI**

**One Library. One Engine. Six Specialized Modules.**

**Minimal Size. Maximum Capability. Extreme Performance.**

Build accordingly.
