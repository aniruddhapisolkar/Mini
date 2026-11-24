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
- \begin{equation}, \begin{multline}, \begin{flalign}
- \mathchoice, \mathpalette
- \href, \htmlClass, \htmlId, \htmlStyle, \htmlData
- \includegraphics
- \raisebox full, \reflectbox
- \lap (llap/rlap/clap) rendering
- Stretchy delimiters sizing (currently text size)
- MathML parallel output improvements
- Auto-render extension
- mhchem chemistry
- copy-tex
- Macros: \def, \newcommand (partial)
- Incremental/streaming rendering
- Font metrics (TeX font metrics) — currently em-based approximations
- Full delimiter sizing

## Notes
- Zero runtime dependencies.
- HTML output uses span-based KaTeX-like class names.
- MathML output provided for accessibility.
