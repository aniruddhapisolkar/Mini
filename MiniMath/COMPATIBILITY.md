# MiniMath — KaTeX Compatibility Matrix (partial)

Owner: Alice
Reference: KaTeX v0.19.1

## Supported (implemented)

### Core
- Lexer, recursive-descent parser, HTML builder, MathML builder
- Superscripts/subscripts (^, _)
- Fractions: \frac, \dfrac, \tfrac, \cfrac
- Square roots: \sqrt, \sqrt[n]
- Matrices: matrix, pmatrix, bmatrix, vmatrix, Vmatrix, Bmatrix
- Environments: array, cases, aligned, gathered, align, split, cd
- Binomial: \binom, \dbinom, \tbinom
- Delimiters: \left, \right, \middle, \big..\Bigg
- Accents: \hat, \check, \tilde, \acute, \grave, \dot, \ddot, \bar, \breve, \vec, \overline, \underline, \overrightarrow, \overleftarrow, \widehat, \widetilde, \overbrace, \underbrace
- Fonts: \mathrm, \mathbf, \mathit, \mathsf, \mathtt, \mathcal, \mathbb, \mathfrak, \mathscr, \mathnormal
- Sizing: \tiny..\Huge
- Spacing: \, \: \; \! \quad \qquad \hspace \mspace \kern \mkern \hfill \hfil
- Greek letters (lower/upper)
- Operators: \sum, \prod, \int, \iint, \iiint, \oint, \lim, \sin, \cos, etc.
- Relations, binary operators, arrows, misc symbols
- \text, \mbox, \hbox, \operatorname
- \href, \htmlClass, \htmlId, \htmlStyle, \htmlData
- \strut
- \color, \boxed, \fbox, \framebox
- \phantom, \vphantom, \hphantom
- \smash, \raisebox, \vcenter
- \not, \cancel, \bcancel, \xcancel
- \tag, \label (no-op)
- \stackrel, \xrightarrow, \xleftarrow
- \mathclap, \mathllap, \mathrlap
- \cr, \newline
- \rule
- \overparen, \underparen

### Illustration DSL
- Basic coordinate axes + function plots (sin, cos, tan, x^2, x^3, sqrt, exp, log)

### Diagram
- Flowchart (Mermaid-compatible), sequence diagrams
- Layouts: layered, force, tree

## Not yet implemented
- \def, \newcommand macros (token-level expansion)
- mhchem chemistry (basic: \ce with subscripts/superscripts)
- copy-tex
- Full TeX font metrics (currently em-based/canvas approximations)
- Full stretchy delimiter sizing
- MathML parallel output improvements

## Notes
- Zero runtime dependencies.
- HTML output uses span-based KaTeX-like class names.
- MathML output provided for accessibility.
