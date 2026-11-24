// MiniMath — Parse node types (KaTeX-inspired)

export type ParseNodeType =
  | "ord" | "text" | "mathord" | "operator" | "bin" | "rel" | "open" | "close"
  | "punct" | "inner" | "genfrac" | "sqrt" | "supsub" | "accent" | "overline"
  | "underline" | "phantom" | "sizing" | "styling" | "spacing" | "kern"
  | "environment" | "delim" | "left" | "right" | "middle" | "color" | "href"
  | "boxed" | "rule" | "vcenter" | "smash" | "raisebox" | "hbox" | "tag"
  | "macro" | "cr" | "binom" | "overbrace" | "underbrace" | "not" | "cancel"
  | "operatorname" | "textop" | "array" | "matrix" | "cases" | "aligned"
  | "stack" | "lap" | "reflectbox" | "includegraphics" | "html" | "mathchoice";

export interface ParseNode {
  type: ParseNodeType;
  mode: "math" | "text";
  [key: string]: unknown;
}

export interface OrdNode extends ParseNode { type: "ord"; text: string; }
export interface TextNode extends ParseNode { type: "text"; text: string; font?: string; }
export interface MathordNode extends ParseNode { type: "mathord"; text: string; }
export interface GenfracNode extends ParseNode {
  type: "genfrac";
  numerator: ParseNode[];
  denominator: ParseNode[];
  hasBarLine: boolean;
  leftDelim: string | null;
  rightDelim: string | null;
  size?: string;
}
export interface SqrtNode extends ParseNode { type: "sqrt"; body: ParseNode[]; index?: ParseNode[]; }
export interface SupsubNode extends ParseNode {
  type: "supsub";
  base?: ParseNode;
  sup?: ParseNode[];
  sub?: ParseNode[];
}
export interface AccentNode extends ParseNode { type: "accent"; label: string; base: ParseNode; }
export interface OverlineNode extends ParseNode { type: "overline"; body: ParseNode[]; }
export interface UnderlineNode extends ParseNode { type: "underline"; body: ParseNode[]; }
export interface PhantomNode extends ParseNode { type: "phantom"; body: ParseNode[]; vphantom?: boolean; hphantom?: boolean; }
export interface SizingNode extends ParseNode { type: "sizing"; size: string; body: ParseNode[]; }
export interface StylingNode extends ParseNode { type: "styling"; style: string; body: ParseNode[]; }
export interface SpacingNode extends ParseNode { type: "spacing"; width: number; }
export interface KernNode extends ParseNode { type: "kern"; dimension: number; }
export interface EnvironmentNode extends ParseNode {
  type: "environment" | "array" | "matrix" | "cases" | "aligned";
  envName: string;
  body: ParseNode[][];
  colAlign?: string[];
  leftDelim?: string;
  rightDelim?: string;
}
export interface LeftNode extends ParseNode { type: "left"; delim: string; }
export interface RightNode extends ParseNode { type: "right"; delim: string; }
export interface MiddleNode extends ParseNode { type: "middle"; delim: string; }
export interface ColorNode extends ParseNode { type: "color"; color: string; body: ParseNode[]; }
export interface HrefNode extends ParseNode { type: "href"; href: string; body: ParseNode[]; }
export interface BoxedNode extends ParseNode { type: "boxed"; body: ParseNode[]; }
export interface RuleNode extends ParseNode { type: "rule"; width: number; height: number; shift: number; }
export interface VcenterNode extends ParseNode { type: "vcenter"; body: ParseNode[]; }
export interface SmashNode extends ParseNode { type: "smash"; body: ParseNode[]; }
export interface RaiseboxNode extends ParseNode { type: "raisebox"; amount: number; body: ParseNode[]; }
export interface HboxNode extends ParseNode { type: "hbox"; body: ParseNode[]; }
export interface TagNode extends ParseNode { type: "tag"; body: ParseNode[]; }
export interface CrNode extends ParseNode { type: "cr"; }
export interface BinomNode extends ParseNode { type: "binom"; numerator: ParseNode[]; denominator: ParseNode[]; }
export interface OverbraceNode extends ParseNode { type: "overbrace"; body: ParseNode[]; }
export interface UnderbraceNode extends ParseNode { type: "underbrace"; body: ParseNode[]; }
export interface NotNode extends ParseNode { type: "not"; body: ParseNode; }
export interface CancelNode extends ParseNode { type: "cancel"; body: ParseNode[]; }
export interface OperatornameNode extends ParseNode { type: "operatorname"; name: string; }
export interface LapNode extends ParseNode { type: "lap"; side: "l" | "r"; body: ParseNode[]; }
export interface ReflectboxNode extends ParseNode { type: "reflectbox"; body: ParseNode[]; }
export interface HtmlNode extends ParseNode { type: "html"; html: string; }
export interface MathchoiceNode extends ParseNode { type: "mathchoice"; display: ParseNode[]; text: ParseNode[]; script: ParseNode[]; scriptscript: ParseNode[]; }

export type Expression = ParseNode[];
