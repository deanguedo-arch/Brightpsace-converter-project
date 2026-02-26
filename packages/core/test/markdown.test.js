import test from "node:test";
import assert from "node:assert/strict";
import { parseMarkdownToUnitBlocks } from "../src/markdown.js";

test("parses headings and directives into structured blocks", () => {
  const markdown = `
## Intro
Welcome text.

:::info
Important note.
:::

### Details
More content.

:::accordion
- First: One
- Second: Two
:::
`;

  const parsed = parseMarkdownToUnitBlocks(markdown);
  assert.equal(parsed.sections.length, 1);
  assert.equal(parsed.sections[0].title, "Intro");
  assert.ok(parsed.nav.some((item) => item.title === "Intro"));
  assert.ok(parsed.nav.some((item) => item.title === "Details"));
  assert.ok(parsed.sections[0].blocks.some((block) => block.type === "callout"));
  assert.ok(parsed.sections[0].blocks.some((block) => block.type === "accordion"));
});
