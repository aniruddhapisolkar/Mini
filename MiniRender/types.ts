// MiniRender — Core Type Definitions
// Phase 1: Minimal shared foundation

// ─── Module kinds ───────────────────────────────────────────────

export type ModuleKind =
  | "diagram"
  | "text"
  | "math"
  | "code"
  | "chart"
  | "table";

// ─── Backend identifiers ────────────────────────────────────────

export type BackendId = "html" | "svg" | "canvas" | "webgl";

// ─── Capability declarations ────────────────────────────────────

export type Capability =
  | "render:html"
  | "render:svg"
  | "render:canvas"
  | "render:webgl"
  | "measure:intrinsic"
  | "measure:async"
  | "compose:embed"
  | "compose:recursive"
  | "export:png"
  | "export:svg"
  | "export:pdf"
  | "export:json"
  | "a11y:aria"
  | "a11y:keyboard"
  | "a11y:screenreader"
  | "perf:virtualize"
  | "perf:stream"
  | "perf:incremental";

// ─── Geometry primitives ────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Transform {
  a: number; // scale x
  b: number; // skew y
  c: number; // skew x
  d: number; // scale y
  e: number; // translate x
  f: number; // translate y
}

export const IDENTITY_TRANSFORM: Transform = {
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  e: 0,
  f: 0,
};

// ─── Measurement contract ───────────────────────────────────────

export interface MeasureConstraints {
  availableWidth?: number;
  availableHeight?: number;
  minWidth?: number;
  minHeight?: number;
  aspectRatio?: number;
}

export interface MeasureResult {
  intrinsic: Size;
  min: Size;
  max?: Size;
  baseline?: number;
  bbox: Rect;
}

// ─── Text metrics ───────────────────────────────────────────────

export interface TextMetrics {
  width: number;
  height: number;
  ascent: number;
  descent: number;
  lineHeight: number;
}

export interface FontSpec {
  family: string;
  size: number;
  weight?: number | string;
  style?: "normal" | "italic" | "oblique";
  lineHeight?: number;
}

// ─── Diagnostics ────────────────────────────────────────────────

export type DiagnosticLevel = "error" | "warning" | "info";

export interface Diagnostic {
  level: DiagnosticLevel;
  code: string;
  message: string;
  location?: { line: number; column: number };
  module?: ModuleKind;
  hint?: string;
}

// ─── Style scope ────────────────────────────────────────────────

export interface StyleScope {
  id: string;
  variables: Record<string, string>;
  parent?: StyleScope;
}

// ─── Render target ──────────────────────────────────────────────

export interface RenderTarget {
  type: BackendId;
  element: unknown; // DOM node, canvas, etc. (platform-dependent)
}

// ─── Render handle ──────────────────────────────────────────────

export interface RenderHandle {
  id: string;
  update(options?: unknown): void;
  destroy(): void;
  export?(format: "html" | "svg" | "png" | "pdf" | "json"): Promise<Blob | string>;
}
