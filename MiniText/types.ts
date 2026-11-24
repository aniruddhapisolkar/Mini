// MiniText — Type definitions (Phase 2)
// Semantic model for Markdown/CommonMark + GFM + Mini extensions.

export type InlineNode =
  | { type: "text"; value: string }
  | { type: "softbreak" }
  | { type: "hardbreak" }
  | { type: "code"; value: string }
  | { type: "emphasis"; children: InlineNode[] }
  | { type: "strong"; children: InlineNode[] }
  | { type: "strikethrough"; children: InlineNode[] }
  | { type: "link"; href: string; title?: string; children: InlineNode[] }
  | { type: "image"; src: string; alt: string; title?: string }
  | { type: "autolink"; href: string; isEmail: boolean }
  | { type: "rawHtml"; value: string }
  | { type: "superscript"; children: InlineNode[] }
  | { type: "subscript"; children: InlineNode[] }
  | { type: "highlight"; children: InlineNode[] }
  | { type: "footnoteRef"; id: string; label?: string };

export type BlockNode =
  | { type: "document"; children: BlockNode[] }
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "heading"; level: number; children: InlineNode[]; id?: string }
  | { type: "thematicBreak" }
  | { type: "codeBlock"; language: string; value: string; fenced: boolean }
  | { type: "htmlBlock"; value: string }
  | { type: "blockquote"; children: BlockNode[] }
  | { type: "list"; ordered: boolean; start: number; tight: boolean; children: ListItemNode[] }
  | { type: "listItem"; children: BlockNode[]; checked?: boolean | null }
  | { type: "table"; header: InlineNode[][]; rows: InlineNode[][][]; align: Array<"left" | "center" | "right" | null> }
  | { type: "footnoteDef"; id: string; children: BlockNode[] }
  | { type: "callout"; kind: string; title?: string; children: BlockNode[] }
  | { type: "details"; summary: string; children: BlockNode[]; open?: boolean };

export type ListItemNode = Extract<BlockNode, { type: "listItem" }>;

export interface TextDocument {
  type: "document";
  children: BlockNode[];
}

export interface LinkReference {
  label: string;
  url: string;
  title?: string;
}
