// MiniMath — MathML builder (basic accessibility output)

import type { ParseNode, Expression } from "./nodes.js";

export function buildMathML(expr: Expression, displayMode = false): string {
  const inner = expr.map(n => mmlNode(n)).join("");
  const tag = displayMode ? "math" : "math";
  return `<${tag} xmlns="http://www.w3.org/1998/Math/MathML" display="${displayMode ? "block" : "inline"}">${inner}</${tag}>`;
}

function mmlNode(node: any): string {
  if (!node) return "";
  switch (node.type) {
    case "ord": case "mathord": case "text":
      return `<mi>${escapeXml(String(node.text ?? ""))}</mi>`;
    case "operator":
      return `<mo>${escapeXml(String(node.text ?? node.name ?? ""))}</mo>`;
    case "bin": case "rel": case "open": case "close": case "punct": case "inner":
      return `<mo>${escapeXml(node.text ?? "")}</mo>`;
    case "genfrac": {
      const num = (node.numerator as Expression).map(mmlNode).join("");
      const den = (node.denominator as Expression).map(mmlNode).join("");
      return `<mfrac>${num ? `<mrow>${num}</mrow>` : ""}${den ? `<mrow>${den}</mrow>` : ""}</mfrac>`;
    }
    case "binom": {
      const num = (node.numerator as Expression).map(mmlNode).join("");
      const den = (node.denominator as Expression).map(mmlNode).join("");
      return `<mrow><mo>(</mo><mfrac linethickness="0"><mrow>${num}</mrow><mrow>${den}</mrow></mfrac><mo>)</mo></mrow>`;
    }
    case "sqrt": {
      const body = (node.body as Expression).map(mmlNode).join("");
      if (node.index) {
        const idx = (node.index as Expression).map(mmlNode).join("");
        return `<mroot><mrow>${body}</mrow><mrow>${idx}</mrow></mroot>`;
      }
      return `<msqrt><mrow>${body}</mrow></msqrt>`;
    }
    case "supsub": {
      const base = node.base ? mmlNode(node.base) : "";
      if (node.sub && node.sup) {
        const sub = (node.sub as Expression).map(mmlNode).join("");
        const sup = (node.sup as Expression).map(mmlNode).join("");
        return `<msubsup>${base}<mrow>${sub}</mrow><mrow>${sup}</mrow></msubsup>`;
      }
      if (node.sub) {
        const sub = (node.sub as Expression).map(mmlNode).join("");
        return `<msub>${base}<mrow>${sub}</mrow></msub>`;
      }
      if (node.sup) {
        const sup = (node.sup as Expression).map(mmlNode).join("");
        return `<msup>${base}<mrow>${sup}</mrow></msup>`;
      }
      return base;
    }
    case "accent": {
      const base = mmlNode(node.base);
      const accMap: Record<string, string> = { hat: "̂", vec: "→", bar: "¯", tilde: "̃" };
      return `<mover><mrow>${base}</mrow><mo>${accMap[node.label] ?? "̂"}</mo></mover>`;
    }
    case "overline": {
      const body = (node.body as Expression).map(mmlNode).join("");
      return `<mover><mrow>${body}</mrow><mo>¯</mo></mover>`;
    }
    case "underline": {
      const body = (node.body as Expression).map(mmlNode).join("");
      return `<munder><mrow>${body}</mrow><mo>_</mo></munder>`;
    }
    case "phantom": {
      const body = (node.body as Expression).map(mmlNode).join("");
      return `<mphantom><mrow>${body}</mrow></mphantom>`;
    }
    case "sizing": case "styling": {
      const body = (node.body as Expression).map(mmlNode).join("");
      return `<mrow>${body}</mrow>`;
    }
    case "spacing": return `<mspace width="${(node.width || 0)}em"/>`;
    case "color": {
      const body = (node.body as Expression).map(mmlNode).join("");
      return `<mstyle mathcolor="${escapeXml(node.color)}"><mrow>${body}</mrow></mstyle>`;
    }
    case "boxed": {
      const body = (node.body as Expression).map(mmlNode).join("");
      return `<mrow>${body}</mrow>`;
    }
    case "cr": return `<mo linebreak="newline"></mo>`;
    case "environment": case "array": case "matrix": case "cases": case "aligned": {
      const rows = (node.body as Expression[]).map(row => {
        const cells = (Array.isArray(row) ? row : [row]).map(cell => {
          const c = Array.isArray((cell as any).body) ? (cell as any).body : [cell];
          return `<mtd><mrow>${c.map((n: any) => mmlNode(n)).join("")}</mrow></mtd>`;
        }).join("");
        return `<mtr>${cells}</mtr>`;
      }).join("");
      const open = node.leftDelim ? `<mo>${escapeXml(node.leftDelim)}</mo>` : "";
      const close = node.rightDelim ? `<mo>${escapeXml(node.rightDelim)}</mo>` : "";
      return `<mrow>${open}<mtable>${rows}</mtable>${close}</mrow>`;
    }
    case "group": case "macro": {
      const body = Array.isArray(node.body) ? (node.body as Expression).map(mmlNode).join("") : "";
      return body;
    }
    default: {
      if (node.body && Array.isArray(node.body)) return (node.body as Expression).map(mmlNode).join("");
      return escapeXml(String(node.text ?? node.value ?? ""));
    }
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
