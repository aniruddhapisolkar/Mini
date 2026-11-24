// MiniRender — Public Exports
// Phase 1: Minimal shared foundation

// Types
export type {
  ModuleKind,
  BackendId,
  Capability,
  Point,
  Size,
  Rect,
  Transform,
  MeasureConstraints,
  MeasureResult,
  TextMetrics,
  FontSpec,
  Diagnostic,
  DiagnosticLevel,
  StyleScope,
  RenderTarget,
  RenderHandle,
} from "./types.js";

export { IDENTITY_TRANSFORM } from "./types.js";

// Interfaces
export type {
  SemanticModel,
  RenderNode,
  RenderContext,
  RenderResult,
  ModuleDescriptor,
  Backend,
  ResourceManager,
  Scheduler,
  Cache,
  Diagnostics,
  Span,
  TextMeasurer,
  EmbedNode,
  StreamController,
  IncrementalUpdate,
} from "./interfaces.js";

// Geometry
export {
  point,
  addPoints,
  subtractPoints,
  scalePoint,
  distance,
  size,
  addSizes,
  scaleSize,
  containsSize,
  rect,
  rectFromPoints,
  rectContains,
  rectIntersects,
  rectUnion,
  rectCenter,
  applyTransform,
  multiplyTransforms,
  invertTransform,
  boundingBox,
} from "./geometry.js";

// Registry
export {
  register,
  unregister,
  getModule,
  hasModule,
  listModules,
  resolveBackend,
} from "./registry.js";

// Lifecycle
export {
  createResourceManager,
  createRenderHandle,
  createDiagnostics,
  createCache,
  createScheduler,
} from "./lifecycle.js";

// Backend
export { HtmlBackend, SvgBackend, createBackend } from "./backend.js";

// Text processing
export {
  sanitizeHtml,
  escapeHtml,
  unescapeHtml,
  normalizeWhitespace,
  decodeEntities,
  applyTypography,
  estimateTextWidth,
  estimateLineHeight,
} from "./text.js";

export type { TypographyOptions } from "./text.js";
