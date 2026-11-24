# MiniText

Markdown/CommonMark + GFM rendering module for Mini.

## Features

- CommonMark 0.31.2 core (headings, paragraphs, code, blockquotes, lists, thematic breaks, HTML blocks, link refs)
- GFM extensions (tables, task lists, strikethrough, autolinks)
- Mini extensions (footnotes, callouts, highlight, superscript/subscript)
- Sanitized HTML rendering
- Typography (smart quotes, dashes, ellipsis)
- Streaming rendering (`createTextStream`)
- Cross-module code highlighting via MiniCode

## API

```ts
import { parseMarkdown, renderDocument } from "mini/text";

const doc = parseMarkdown(markdown);
const html = renderDocument(doc);
```

## Streaming

```ts
import { createTextStream } from "mini/text";

const stream = createTextStream(container);
stream.push("# Hello\n");
stream.push("world");
stream.flush();
```
