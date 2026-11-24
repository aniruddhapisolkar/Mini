// MiniRender — Core Interfaces
// Phase 1: Minimal shared foundation

import type {
  ModuleKind,
  BackendId,
  Capability,
  RenderTarget,
  RenderHandle,
  MeasureConstraints,
  MeasureResult,
  Diagnostic,
  StyleScope,
} from "./types.js";

// ─── Semantic model ─────────────────────────────────────────────

export interface SemanticModel {
  kind: ModuleKind;
  version: number;
  metadata?: Record<string, unknown>;
}

// ─── Render node (extensible) ───────────────────────────────────

export interface RenderNode<K extends string = string> {
  id: string;
  kind: "element" | "text" | "group" | "foreign" | K;
  children?: RenderNode<K>[];
  bounds?: { x: number; y: number; width: number; height: number };
  metadata?: Record<string, unknown>;
}

// ─── Render context ─────────────────────────────────────────────

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

// ─── Render result ──────────────────────────────────────────────

export interface RenderResult {
  handle: RenderHandle;
  node?: RenderNode;
}

// ─── Module descriptor ──────────────────────────────────────────

export interface ModuleDescriptor {
  id: ModuleKind;
  name: string;
  version: string;
  capabilities: Capability[];
  supportedBackends: BackendId[];
  parse(input: unknown, options?: unknown): SemanticModel;
  render(model: SemanticModel, ctx: RenderContext): RenderResult;
  measure?(
    model: SemanticModel,
    ctx: RenderContext,
    constraints?: MeasureConstraints
  ): MeasureResult;
  dispose?(instance: RenderHandle): void;
}

// ─── Backend interface ──────────────────────────────────────────

export interface Backend {
  id: BackendId;
  supports: Capability[];
  createTarget(container: unknown): RenderTarget;
  render(node: RenderNode, ctx: RenderContext): void;
  clear(target: RenderTarget): void;
  measureText(text: string, font: { family: string; size: number }): { width: number; height: number };
  dispose(target: RenderTarget): void;
}

// ─── Resource manager ───────────────────────────────────────────

export interface ResourceManager {
  acquire(key: string, factory: () => unknown): unknown;
  release(key: string): void;
  has(key: string): boolean;
}

// ─── Scheduler ──────────────────────────────────────────────────

export interface Scheduler {
  schedule(fn: () => void): void;
  invalidate(nodeId: string): void;
  flush(): void;
}

// ─── Cache ──────────────────────────────────────────────────────

export interface Cache {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
}

// ─── Diagnostics ────────────────────────────────────────────────

export interface Diagnostics {
  report(diagnostic: Diagnostic): void;
  getErrors(): Diagnostic[];
  getWarnings(): Diagnostic[];
  clear(): void;
}

// ─── Span (shared token primitive) ──────────────────────────────

export interface Span {
  text: string;
  kind: string;
  range: [number, number];
  children?: Span[];
  style?: Record<string, string>;
  dataRef?: { row?: number; col?: number; series?: number; point?: number };
}

// ─── Text measurer ──────────────────────────────────────────────

export interface TextMeasurer {
  measure(text: string, font: { family: string; size: number; weight?: number | string; style?: string }): {
    width: number;
    height: number;
    ascent: number;
    descent: number;
    lineHeight: number;
  };
  measureRange(
    text: string,
    font: { family: string; size: number; weight?: number | string; style?: string },
    start: number,
    end: number
  ): { width: number; height: number; ascent: number; descent: number; lineHeight: number };
  lineHeight(font: { family: string; size: number; weight?: number | string; style?: string }): number;
  wrap(text: string, font: { family: string; size: number; weight?: number | string; style?: string }, maxWidth: number): string[];
}

// ─── Embed node ─────────────────────────────────────────────────

export interface EmbedNode {
  type: "embed";
  kind: ModuleKind;
  input: unknown;
  options?: Record<string, unknown>;
}

// ─── Stream controller ──────────────────────────────────────────

export interface StreamController<T = string> {
  push(chunk: T): void;
  flush(): void;
  onProgress(cb: (partial: RenderHandle) => void): void;
  pushData(rows: unknown[]): void;
  onBackpressure(cb: () => void): void;
}

// ─── Incremental update ─────────────────────────────────────────

export interface IncrementalUpdate {
  changedRanges: Array<{ start: number; end: number }>;
  changedData?: { rows?: number[]; cols?: number[]; series?: number[] };
  strategy: "patch" | "rebuild";
}
