import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ingestUnit } from "../src/ingestUnit.js";

test("ingestUnit parses flashcards CSV and resources", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cf-ingest-"));
  const courseDir = path.join(root, "courses", "example-course");
  const unitDir = path.join(courseDir, "units", "unit-01");
  await fs.mkdir(path.join(unitDir, "resources"), { recursive: true });

  await fs.writeFile(path.join(courseDir, "course.yml"), "slug: example-course\ndefault: true\n", "utf8");
  await fs.writeFile(
    path.join(unitDir, "unit.yml"),
    "slug: unit-01\ntitle: Unit 01\nobjectives:\n  - Learn one\n  - Learn two\n",
    "utf8"
  );
  await fs.writeFile(path.join(unitDir, "content.md"), "## Section\n\nHello world.\n", "utf8");
  await fs.writeFile(path.join(unitDir, "flashcards.csv"), "front,back,tag\nQ1,A1,core\n", "utf8");
  await fs.writeFile(path.join(unitDir, "resources", "file.pdf"), "pdf", "utf8");

  const model = await ingestUnit(root, "example-course", "unit-01");
  assert.equal(model.flashcards.length, 1);
  assert.equal(model.flashcards[0].front, "Q1");
  assert.equal(model.resources.length, 1);
  assert.equal(model.resources[0].kind, "pdf");
});
