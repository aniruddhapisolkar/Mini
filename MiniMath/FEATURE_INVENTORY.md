# MiniMath — Feature Inventory

Owner: Alice
References: KaTeX (KaTeX/KaTeX v0.19.1) for typesetting; original mathematical illustration DSL (Pele-inspired) for illustrations
Status: Phase 0 research

## 1. Reference libraries pinned

- KaTeX: https://github.com/KaTeX/KaTeX — v0.19.1 (latest stable). MIT. Fast, synchronous TeX math rendering. Layout based on Donald Knuth's TeX. No runtime deps. Server-side rendering. See supported functions: https://katex.org/docs/supported.html.
- Additional: MathJax (compatibility/edge cases), AsciiMath, MathML spec, TeXbook (Knuth), mhchem (chemistry), copy-tex.
- Mathematical visualization: Plotly, D3, three.js (3D), Observable Plot, Manim (animation reference), JSXGraph (geometry).

License note: KaTeX MIT; fonts (KaTeX fonts) — verify licensing/redistribution. MathJax MIT. Verify before vendoring fonts.

## 2. Part A — Mathematical typesetting (KaTeX parity + exceed)

Must achieve complete functional parity with KaTeX v0.19.1, then exceed. Includes every supported command, environment, symbol, macro, delimiter, alignment, spacing, sizing, font/typographic feature, config option, rendering behavior.

### 2.1 Core pipeline
- Lexer / tokenizer (TeX commands, environments, grouping)
- Macro expander
- Parser (recursive descent) producing parse tree
- Build HTML (span-based layout) + MathML (accessibility)
- Font metrics (TeX font metrics, kerning, italic correction)
- Delimiter sizing/stretchy
- Spacing rules (thin/medium/thick spaces, inter-atom spacing)
- Style/size handling (display/text/script/scriptscript)

### 2.2 Functions (src/functions) — parity targets
accent, accentunder, arrow, char, color, cr (line break), def, delimsizing, enclose, environment, font, genfrac, hbox, horizBrace, href, html, htmlmathml, includegraphics, kern, lap, math, mathchoice, mclass, op, operatorname, ordgroup, overline, phantom, pmb, raisebox, reflectbox, relax, rule, sizing, smash, sqrt, styling, supsub, symbolsOp, symbolsOrd, symbolsSpacing, tag, text, underline, utils, vcenter, verb.

### 2.3 Environments (src/environments)
- array (with alignment columns, vertical rules)
- cd (commutative diagrams)
- Plus environments defined via defineEnvironment: matrix, pmatrix, bmatrix, vmatrix, Vmatrix, Bmatrix, cases, aligned, gathered, split, align, eqnarray, etc.

### 2.4 Symbols
- Greek, operators, relations, arrows, delimiters, misc, mathord/mathbin/mathrel/mathopen/mathclose/mathpunct/mathinner
- Unicode symbols, wide characters, accents (unicodeAccents)
- Superscript/subscript (unicodeScripts/SupOrSub)

### 2.5 Macros
- \def, \newcommand, \renewcommand, \providecommand
- Macro expansion, argument substitution
- Built-in macros (\TeX, \LaTeX, etc.)

### 2.6 Delimiters
- \left/\right, \middle, \big/\Big/\bigg/\Bigg
- Stretchy delimiters, sizing

### 2.7 Alignment & spacing
- & alignment in arrays/aligned
- Spacing commands: \, \; \: \! \quad \qquad \hspace \mspace \kern \mkern
- \hfill, \hfil, phantom spacing

### 2.8 Sizing
- \tiny..\Huge, \scriptsize, etc.
- \mathchoice, \mathpalette

### 2.9 Fonts & typographic features
- Math fonts: roman, bold, italic, sans-serif, typewriter, fraktur, blackboard, script, caligraphic
- \text{}, \mathrm{}, \mathbf{}, \mathit{}, \mathsf{}, \mathtt{}, \mathfrak{}, \mathbb{}, \mathscr{}, \mathcal{}
- Font size, style, weight, variant

### 2.10 Config options
- displayMode, throwOnError, errorColor, macros, minRuleThickness, maxSize, maxExpand, strict, trust, globalGroup, output (html/mathml), fleqn, leqno, colorIsTextColor, etc.

### 2.11 Rendering output
- HTML (span-based, CSS classes)
- MathML (parallel, for accessibility)
- Server-side rendering (same output regardless of env)
- Auto-render extension (renderMathInElement)

### 2.12 Accessibility
- MathML output, ARIA
- Copy-tex
- Color contrast

### 2.13 Extensions / contrib
- mhchem (chemistry)
- copy-tex
- auto-render
- (MiniMath should support these where valuable, plus exceed: more packages)

### 2.14 Exceed baseline
- Additional LaTeX packages (amsmath/amssymb/amsfonts already partly; mathtools, physics, etc.)
- Better error messages with source locations
- Incremental/streaming rendering
- Tighter integration with illustration DSL

## 3. Part B — Mathematical illustration DSL (original, Pele-inspired)

Original declarative language. Simple and aesthetically refined like Pele, powerful enough to illustrate practically any math concept. Must integrate seamlessly with typesetting.

### 3.1 Coordinate systems
- 2D Cartesian, polar, complex plane, 3D
- Custom axes, ticks, labels, grid, origin, scale (linear/log)
- Multiple coordinate systems in one scene

### 3.2 Curves & functions
- Function plots y=f(x), parametric curves, polar plots r=f(θ)
- Implicit curves F(x,y)=0
- Piecewise functions
- Parametric surfaces, volumes (3D)
- Vector fields, scalar fields (heatmaps/contours)

### 3.3 Geometry
- Points, lines, segments, rays, vectors
- Circles, ellipses, polygons, arcs
- Euclidean constructions (compass/straightedge style)
- Angles, lengths, right-angle markers
- Transformations: translate/rotate/scale/reflect/shear, matrix transforms
- Linear algebra illustrations (basis, eigenvectors)

### 3.4 Calculus
- Limits and convergence (sequences, series)
- Derivatives (tangent lines, secants)
- Integrals (Riemann sums, area under curve)
- Differential equations (slope fields, phase portraits)
- 3D surfaces/volumes of revolution

### 3.5 Probability & statistics
- Distributions (normal, binomial, Poisson, etc.)
- Histograms, box plots, scatter
- Statistical illustrations (confidence intervals, regression lines)

### 3.6 Graphs & networks (mathematical)
- Nodes/edges with math labels
- Trees, directed/undirected

### 3.7 3D geometry
- Points, lines, planes, polyhedra, surfaces
- Projections, camera controls

### 3.8 Animation & interactivity
- Animated transitions (limits, transformations)
- Interactive models (sliders, draggable points)
- Reduced motion

### 3.9 Annotations
- Rich text, math equations, labels, arrows, callouts
- Composable scenes (nested)

### 3.10 Rendering backends
- SVG for 2D (crisp, accessible)
- Canvas for dense plots
- WebGL for 3D/large datasets

## 4. Shared primitives (Alice contributes to MiniRender)
- Geometry primitives: Point, Vector, Matrix, Transform, BBox, Path
- Coordinate transformation utilities
- Spatial layout algorithms
- Graphical primitives: line, arc, polygon, bezier, text measurement
- Numeric utilities (interpolation, sampling, root finding)

## 5. Performance
- Fast path for simple expressions (no full AST where possible)
- Typed arrays for geometry
- Caching of font metrics and layout
- Lazy loading of 3D/WebGL backend
- Benchmarks vs KaTeX (render time, bundle size) and vs JSXGraph/Plotly for illustrations

## 6. Accessibility
- MathML output for typesetting
- ARIA descriptions for illustrations
- Keyboard navigation for interactive models
- Reduced motion

## 7. Export & serialization
- HTML/SVG output
- PNG/PDF via shared export
- JSON serialization of scene graph

## 8. Public API (draft)
```ts
Mini.math.render(latex, container, options?);
Mini.math.renderToHTML(latex, options?);
Mini.math.renderToMathML(latex, options?);
Mini.math.parse(latex); // parse tree
// illustration DSL
Mini.math.illustrate(source, container, options?);
Mini.math.scene([...]);
```

## 9. Build / distribution
- Zero runtime deps
- ESM + CJS + UMD, tree-shakeable
- Standalone bundle (fonts embeddable in single HTML)
- TypeScript declarations
- Separate bundles: typesetting core, illustrations, 3D/WebGL
- Font subsetting/embedding for offline standalone HTML
