# hast-util-get-xpath

Utility to get XPath for [hast](https://github.com/syntax-tree/hast) nodes.

## Usage

```typescript
import { getXPath } from "hast-util-get-xpath";
import type * as hast from "hast";

const div: hast.Element = {
  type: "element",
  tagName: "div",
  properties: {},
  children: [],
};

const doc: hast.Root = {
  type: "root",
  children: [
    {
      type: "element",
      tagName: "html",
      properties: {},
      children: [
        {
          type: "element",
          tagName: "body",
          properties: {},
          children: [div],
        },
      ],
    },
  ],
};

assert.strictEqual(getXPath(doc, div), "/html/body/div");
```

## License

MIT license.

Some test cases are adapted from [thiagodp/get-xpath](https://github.com/thiagodp/get-xpath) (MIT license).
