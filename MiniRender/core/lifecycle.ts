// MiniRender — Lifecycle helpers (Phase 1, Cortana)

import type { ModuleKind, RenderHandle } from "./types";
import type { RenderNode } from "./interfaces";

let handleCounter = 0;

export function createRenderHandle(
  kind: ModuleKind,
  root: RenderNode,
  updateFn: (input?: unknown, options?: unknown) => void,
  destroyFn: () => void,
  exportFn?: (format: string) => Promise<Blob | string>
): RenderHandle {
  const id = `mini-${++handleCounter}`;
  let destroyed = false;

  const handle: RenderHandle = {
    id,
    update(input?: unknown, options?: unknown) {
      if (destroyed) return;
      updateFn(input, options);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      destroyFn();
    },
  };

  if (exportFn) {
    handle.export = async (format) => {
      if (destroyed) throw new Error("Cannot export a destroyed handle");
      return exportFn(format);
    };
  }

  return handle;
}
