successfully downloaded text file (SHA: fd7e6dc30723f3cf39847fd51f5e5de7e2282dbe)
// MiniRender — TextMeasurer implementations (Phase 1, Jimbo)
// Re-exports CanvasTextMeasurer and provides a DOM-based fallback.

export { CanvasTextMeasurer } from "./index";
export type { TextMeasurer } from "../core/types";

// DOM-based measurer (uses getBoundingClientRect on a hidden span)
export class DomTextMeasurer {
  measure(text: string, font: import("../core/types").FontSpec): import("../core/types").TextMetrics {
    if (typeof document === "undefined") {
      // Fallback: approximate
      return { width: text.length * font.size * 0.6, height: font.size * 1.2, ascent: font.size * 0.8, descent: font.size * 0.2, lineHeight: font.size * 1.2 };
    }
    const span = document.createElement("span");
    span.style.fontFamily = font.family;
    span.style.fontSize = `${font.size}px`;
    span.style.fontWeight = String(font.weight ?? "normal");
    span.style.fontStyle = font.style ?? "normal";
    span.style.visibility = "hidden";
    span.style.position = "absolute";
    span.style.whiteSpace = "pre";
    span.textContent = text;
    document.body.appendChild(span);
    const rect = span.getBoundingClientRect();
    document.body.removeChild(span);
    const height = font.lineHeight ?? font.size * 1.2;
    return { width: rect.width, height, ascent: height * 0.8, descent: height * 0.2, lineHeight: height };
  }

  measureRange(text: string, font: import("../core/types").FontSpec, start: number, end: number): import("../core/types").TextMetrics {
    return this.measure(text.slice(start, end), font);
  }

  lineHeight(font: import("../core/types").FontSpec): number {
    return font.lineHeight ?? font.size * 1.2;
  }

  wrap(text: string, font: import("../core/types").FontSpec, maxWidth: number): string[] {
    const words = text.split(/(\s+)/);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const test = current + word;
      const w = this.measure(test, font).width;
      if (w > maxWidth && current.length > 0) {
        lines.push(current.trimEnd());
        current = word.trimStart();
      } else {
        current = test;
      }
    }
    if (current.trim().length > 0) lines.push(current.trimEnd());
    if (lines.length === 0) lines.push("");
    return lines;
  }
}
