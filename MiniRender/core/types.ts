// MiniRender — shared core types and contracts (Phase 1)
// Shared by all six modules. Keep this file dependency-free.

export type ModuleKind = "diagram" | "text" | "math" | "code" | "chart" | "table";

export type BackendId = "html" | "svg" | "canvas" | "webgl";

export type Capability =
  | "render:html" | "render:svg" | "render:canvas" | "render:webgl"
  | "measure:intrinsic" | "measure:async"
  | "compose:embed" | "compose:recursive"
  | "export:png" | "export:svg" | "export:pdf" | "export:json"
  | "a11y:aria" | "a11y:keyboard" | "a11y:screenreader"
  | "perf:virtualize" | "perf:stream" | "perf:incremental";

export interface Rect { x: number; y: number; width: number; height: number; }
export interface Size { width: number; height: number; }
export interface Point { x: number; y: number; }
export type Transform = {
  a: number; b: number; c: number; d: number; e: number; f: number; // 2x3 affine
};

export interface SemanticModel {
  kind: ModuleKind;
  version: number;
  metadata?: Record<string, unknown>;
}

export interface EmbedNode {
  type: "embed";
  kind: ModuleKind;
  input: unknown;
  options?: Record<string, unknown>;
}

export interface RenderNode<K extends string = string> {
  id: string;
  kind: "element" | "text" | "group" | "foreign" | K;
  children?: RenderNode<K>[];
  bounds?: Rect;
  metadata?: Record<string, unknown>;
}

export interface RenderTarget {
  element: HTMLElement | HTMLCanvasElement | SVGElement;
  backend: BackendId;
}

export interface StyleScope {
  root: HTMLElement;
  variables: Record<string, string>;
}

export interface RenderHandle {
  id: string;
  kind: ModuleKind;
  root: RenderNode;
  update(input?: unknown, options?: unknown): void;
  destroy(): void;
  export?(format: "png" | "svg" | "pdf" | "json" | "html"): Promise<Blob | string>;
  measure?(): Size;
}

export interface RenderResult {
  handle: RenderHandle;
  node?: RenderNode;
}

export interface RenderContext {
  backend: Backend;
  container: RenderTarget;
  scope: StyleScope;
  resources: ResourceManager;
  scheduler: Scheduler;
  cache: Cache;
  diagnostics: Diagnostics;
  signal?: AbortSignal;
  mode: "sync" | "stream" | "incremental";
}

export interface Backend {
  id: BackendId;
  supports: Capability[];
  createTarget(container: HTMLElement): RenderTarget;
  render(node: RenderNode, ctx: RenderContext): void;
  clear(target: RenderTarget): void;
  measureText(text: string, font: FontSpec): TextMetrics;
  dispose(target: RenderTarget): void;
}

export interface FontSpec {
  family: string;
  size: number;
  weight?: number | string;
  style?: "normal" | "italic" | "oblique";
  lineHeight?: number;
}

export interface TextMetrics {
  width: number;
  height: number;
  ascent: number;
  descent: number;
}

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

export interface ModuleDescriptor {
  id: ModuleKind;
  name: string;
  version: string;
  capabilities: Capability[];
  supportedBackends: BackendId[];
  parse(input: unknown, options?: unknown): SemanticModel;
  render(model: SemanticModel, ctx: RenderContext): RenderResult;
  measure?(model: SemanticModel, ctx: RenderContext, constraints?: MeasureConstraints): MeasureResult;
  dispose?(instance: RenderHandle): void;
}

// Diagnostics
export interface Diagnostic {
  level: "error" | "warn" | "info";
  code: string;
  message: string;
  location?: { line: number; column: number };
  module?: ModuleKind;
  hint?: string;
}
export interface Diagnostics {
  emit(d: Diagnostic): void;
  list(): Diagnostic[];
  clear(): void;
}

// Scheduler
export interface Scheduler {
  schedule(fn: () => void, priority?: "high" | "normal" | "low"): void;
  invalidate(nodeId: string): void;
  flush(): void;
  cancelAll(): void;
}

// Cache
export interface Cache {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttlMs?: number): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
}

// ResourceManager
export interface Resource {
  id: string;
  type: "font" | "grammar" | "image" | "webgl-context" | "shader" | "other";
  owner: ModuleKind | "render";
  refCount: number;
}
export interface ResourceManager {
  acquire(id: string, type: Resource["type"], owner: ModuleKind | "render"): Resource;
  release(id: string): void;
  get(id: string): Resource | undefined;
  list(): Resource[];
}

// Streaming
export interface StreamController<T = string> {
  push(chunk: T): void;
  flush(): void;
  onProgress(cb: (partial: RenderHandle) => void): void;
  pushData?(rows: unknown[]): void;
  onBackpressure?(cb: () => void): void;
}

// Incremental
export interface IncrementalUpdate {
  changedRanges?: Array<{ start: number; end: number }>;
  changedData?: { rows?: number[]; cols?: number[]; series?: number[] };
  strategy: "patch" | "rebuild";
}
