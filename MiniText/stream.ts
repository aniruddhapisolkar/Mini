// MiniText — streaming rendering support (Phase 3)

import { parseMarkdown } from "./parser.js";
import { renderDocument } from "./render.js";
import type { StreamController } from "../MiniRender/core/interfaces.js";
import type { RenderHandle } from "../MiniRender/core/types.js";

export interface TextStreamController extends StreamController<string> {
  getBuffer(): string;
}

export function createTextStream(
  container: HTMLElement,
  options?: { sanitize?: boolean; typography?: boolean }
): TextStreamController {
  const buffer: string[] = [];
  const progressCbs: Array<(partial: RenderHandle) => void> = [];
  const backpressureCbs: Array<() => void> = [];
  let flushed = false;

  const wrapper = document.createElement("div");
  wrapper.className = "mini-text mini-text-stream";
  container.appendChild(wrapper);

  const handle: RenderHandle = {
    id: "text-stream",
    update() {},
    destroy() { wrapper.remove(); },
  };

  function render() {
    const src = buffer.join("");
    const doc = parseMarkdown(src);
    wrapper.innerHTML = renderDocument(doc, { sanitize: options?.sanitize !== false, typography: options?.typography === true });
    for (const cb of progressCbs) cb(handle);
  }

  const controller: TextStreamController = {
    push(chunk: string) {
      buffer.push(chunk);
      render();
    },
    flush() {
      flushed = true;
      render();
    },
    onProgress(cb) { progressCbs.push(cb); },
    pushData(rows: unknown[]) { /* not applicable for text */ },
    onBackpressure(cb) { backpressureCbs.push(cb); },
    getBuffer() { return buffer.join(""); },
  };

  return controller;
}
