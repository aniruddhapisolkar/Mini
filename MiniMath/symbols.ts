// MiniMath — Symbol tables (Greek letters, operators, delimiters, accents)
// Subset of KaTeX v0.19.1 symbol tables; extensible.

export interface SymbolInfo {
  name: string;
  type: "ord" | "bin" | "rel" | "open" | "close" | "punct" | "op" | "inner";
  value?: string; // HTML entity or literal
  mode?: "math" | "text";
}

// Greek lowercase
export const greekLower: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε",
  zeta: "ζ", eta: "η", theta: "θ", vartheta: "ϑ", iota: "ι", kappa: "κ",
  lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", omicron: "ο", pi: "π", varpi: "ϖ",
  rho: "ρ", varrho: "ϱ", sigma: "σ", varsigma: "ς", tau: "τ", upsilon: "υ",
  phi: "φ", varphi: "ϕ", chi: "χ", psi: "ψ", omega: "ω",
};
export const greekUpper: Record<string, string> = {
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π",
  Sigma: "Σ", Upsilon: "Υ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
};

// Common operators (big ops)
export const bigOps: Record<string, string> = {
  sum: "∑", prod: "∏", coprod: "∐", int: "∫", iint: "∬", iiint: "∭",
  oint: "∮", bigcap: "∩", bigcup: "∪", bigsqcup: "⊔", bigvee: "∨",
  bigwedge: "∧", bigotimes: "⊗", bigoplus: "⊕", bigodot: "⊙", biguplus: "⊎",
};

// Math operators (function names)
export const mathOperators: string[] = [
  "sin", "cos", "tan", "cot", "sec", "csc", "sinh", "cosh", "tanh", "coth",
  "arcsin", "arccos", "arctan", "arg", "deg", "det", "dim", "exp", "gcd",
  "hom", "inf", "ker", "lg", "lim", "liminf", "limsup", "ln", "log", "max",
  "min", "mod", "Pr", "sup", "lcm",
];

// Relation symbols
export const relations: Record<string, string> = {
  le: "≤", leq: "≤", ge: "≥", geq: "≥", ne: "≠", neq: "≠", approx: "≈",
  equiv: "≡", sim: "∼", simeq: "≃", cong: "≅", propto: "∝", prec: "≺",
  succ: "≻", preceq: "⪯", succeq: "⪰", subset: "⊂", supset: "⊃",
  subseteq: "⊆", supseteq: "⊇", in: "∈", ni: "∋", notin: "∉", mid: "∣",
  parallel: "∥", perp: "⊥", models: "⊨", vdash: "⊢", dashv: "⊣",
  ll: "≪", gg: "≫", doteq: "≐", asymp: "≍", bowtie: "⋈",
};

// Binary operators
export const binOps: Record<string, string> = {
  times: "×", div: "÷", pm: "±", mp: "∓", cdot: "·", bullet: "•",
  circ: "∘", star: "⋆", ast: "∗", wedge: "∧", vee: "∨", cap: "∩",
  cup: "∪", uplus: "⊎", sqcap: "⊓", sqcup: "⊔", triangleleft: "⊲",
  triangleright: "⊳", bigtriangleup: "△", bigtriangledown: "▽",
  dagger: "†", ddagger: "‡", amalg: "∐", setminus: "∖", wr: "≀",
};

// Delimiters
export const delimiters: Record<string, string> = {
  lfloor: "⌊", rfloor: "⌋", lceil: "⌈", rceil: "⌉",
  langle: "⟨", rangle: "⟩", lbrace: "{", rbrace: "}",
  lbrack: "[", rbrack: "]", lparen: "(", rparen: ")",
  vert: "|", Vert: "‖", backslash: "\\", slash: "/",
  ulcorner: "⌜", urcorner: "⌝", llcorner: "⌞", lrcorner: "⌟",
};

// Arrows
export const arrows: Record<string, string> = {
  leftarrow: "←", Leftarrow: "⇐", rightarrow: "→", Rightarrow: "⇒",
  leftrightarrow: "↔", Leftrightarrow: "⇔", uparrow: "↑", downarrow: "↓",
  Uparrow: "⇑", Downarrow: "⇓", mapsto: "↦", to: "→", gets: "←",
  longrightarrow: "⟶", Longleftarrow: "⟸", Longleftrightarrow: "⟺",
  nearrow: "↗", searrow: "↘", swarrow: "↙", nwarrow: "↖",
  hookrightarrow: "↪", hookleftarrow: "↩", rightleftharpoons: "⇌",
};

// Misc symbols
export const misc: Record<string, string> = {
  infty: "∞", partial: "∂", nabla: "∇", emptyset: "∅", forall: "∀",
  exists: "∃", neg: "¬", prime: "′", hbar: "ℏ", ell: "ℓ", wp: "℘",
  Re: "ℜ", Im: "ℑ", aleph: "ℵ", beth: "ℶ", gimel: "ℷ",
  cdots: "⋯", ldots: "…", vdots: "⋮", ddots: "⋱",
  dots: "…", dotsb: "⋯", dotsc: "…", dotsi: "⋯", dotsm: "⋯",
  therefore: "∴", because: "∵", angle: "∠", measuredangle: "∡",
  sphericalangle: "∢", top: "⊤", bot: "⊥", triangle: "△",
  square: "□", diamond: "◇", star: "⋆", checkmark: "✓",
  dagger: "†", ddagger: "‡", S: "§", P: "¶", copyright: "©",
};

// Accents (combining)
export const accents: Record<string, string> = {
  hat: "̂", check: "̌", tilde: "̃", acute: "́", grave: "̀",
  dot: "̇", ddot: "̈", bar: "̄", breve: "̆", vec: "⃗",
};

// Accents that wrap (overline etc.) handled specially

// Font commands
export const fontCommands: Record<string, string> = {
  mathrm: "roman", mathbf: "bold", mathit: "italic", mathsf: "sans",
  mathtt: "mono", mathcal: "caligraphic", mathbb: "blackboard",
  mathfrak: "fraktur", mathscr: "script", mathnormal: "normal",
  rm: "roman", bf: "bold", it: "italic", sf: "sans", tt: "mono",
  cal: "caligraphic", bb: "blackboard", frak: "fraktur",
};

// Sizing commands -> CSS font-size scale
export const sizeCommands: Record<string, number> = {
  tiny: 0.5, scriptsize: 0.7, footnotesize: 0.8, small: 0.85,
  normalsize: 1, large: 1.2, Large: 1.44, LARGE: 1.73, huge: 2.08, Huge: 2.5,
};
