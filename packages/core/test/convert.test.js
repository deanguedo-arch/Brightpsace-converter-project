import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { convertUnitFromSource } from "../src/convert.js";
import { CALM_MODULE_2_CORPUS } from "./fixtures/calmModule2Corpus.js";

test("convertUnitFromSource converts CALM Module 1 sources through the guided pipeline", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cf-convert-"));
  const sourceDir = path.join(root, "source");
  await fs.mkdir(sourceDir, { recursive: true });

  const sourceFile = path.join(sourceDir, "calm-module-1.txt");
  await fs.writeFile(
    sourceFile,
    [
      "Career and Life Management",
      "Module 1",
      "Personal Choices",
      "",
      "Relationship Progression Activity",
      "Below, there are 16 \"relationship steps\".",
      "",
      "Intercourse",
      "Talking On The Phone",
      "Flirting",
      "",
      "Personal Choices: Alcohol Awareness",
      "Why do you think people drink?",
      "",
      "Summative Task B: \"Inside Out\" Film Study",
      "1. When we meet Riley, Joy is in charge. Which emotion(s) do you feel most often? Explain.",
      "2. Riley moves from Minnesota to San Francisco. Have you gone through a big transition? Explain."
    ].join("\n"),
    "utf8"
  );

  const result = await convertUnitFromSource({
    repoRoot: root,
    sourcePath: sourceFile,
    courseSlug: "calm-course",
    unitSlug: "module-1-v2",
    extract: false
  });

  const unitDir = path.join(root, "courses", "calm-course", "units", "module-1-v2");
  const contentPath = path.join(unitDir, "content.md");
  const blueprintPath = path.join(unitDir, "blueprint.convert.json");
  const resourcesCopy = path.join(unitDir, "resources", "calm-module-1.txt");
  const content = await fs.readFile(contentPath, "utf8");
  const blueprint = JSON.parse(await fs.readFile(blueprintPath, "utf8"));

  assert.equal(result.courseSlug, "calm-course");
  assert.equal(result.unitSlug, "module-1-v2");
  assert.match(content, /## Module Launch/);
  assert.match(content, /Relationship Progression/i);
  assert.match(content, /Alcohol Awareness/i);
  assert.match(content, /Inside Out/i);
  assert.match(content, /:::submission/);
  assert.ok(Array.isArray(blueprint.patternDecisions));
  assert.ok(blueprint.patternDecisions.length > 0);
  assert.equal(await fs.stat(resourcesCopy).then((stats) => stats.isFile()), true);
});

test("convertUnitFromSource keeps unknown sources on the guided conversion path", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cf-convert-fallback-"));
  const sourceDir = path.join(root, "source");
  await fs.mkdir(sourceDir, { recursive: true });

  const sourceFile = path.join(sourceDir, "notes.txt");
  await fs.writeFile(
    sourceFile,
    "This is unrelated content about planning, boundaries, and wellbeing.",
    "utf8"
  );

  await convertUnitFromSource({
    repoRoot: root,
    sourcePath: sourceFile,
    courseSlug: "fallback-course",
    unitSlug: "unit-a",
    extract: false
  });

  const contentPath = path.join(root, "courses", "fallback-course", "units", "unit-a", "content.md");
  const blueprintPath = path.join(root, "courses", "fallback-course", "units", "unit-a", "blueprint.convert.json");
  const content = await fs.readFile(contentPath, "utf8");
  const blueprint = JSON.parse(await fs.readFile(blueprintPath, "utf8"));
  assert.match(content, /## Module Launch/);
  assert.match(content, /## Review & Submit/);
  assert.match(content, /:::submission/);
  assert.ok(Array.isArray(blueprint.patternDecisions));
  assert.equal(blueprint.converter, "guided-auto");
});

test("convertUnitFromSource converts CALM Module 2 sources into a resource choices unit draft", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cf-convert-module-2-"));
  const sourceDir = path.join(root, "source");
  await fs.mkdir(sourceDir, { recursive: true });

  const sourceFile = path.join(sourceDir, "calm-module-2.txt");
  await fs.writeFile(sourceFile, CALM_MODULE_2_CORPUS, "utf8");

  const result = await convertUnitFromSource({
    repoRoot: root,
    sourcePath: sourceFile,
    courseSlug: "calm-course",
    unitSlug: "module-2-v2",
    extract: false
  });

  const unitDir = path.join(root, "courses", "calm-course", "units", "module-2-v2");
  const contentPath = path.join(unitDir, "content.md");
  const blueprintPath = path.join(unitDir, "blueprint.convert.json");
  const content = await fs.readFile(contentPath, "utf8");
  const blueprint = JSON.parse(await fs.readFile(blueprintPath, "utf8"));

  assert.equal(result.courseSlug, "calm-course");
  assert.equal(result.unitSlug, "module-2-v2");
  assert.match(content, /## Module Launch/);
  assert.match(content, /Spending Influences/i);
  assert.match(content, /Joe vs\. Sally/i);
  assert.match(content, /Budget Builder/i);
  assert.match(content, /Honesty and Relationship Cases/i);
  assert.match(content, /Joe gets a job as a clerk at Wal-Mart/i);
  assert.match(content, /Gertrude sees her friend Ethyl tagging the wall/i);
  assert.match(content, /What if Joanne told Amanda that her family would kick her out/i);
  assert.match(content, /Student Name/i);
  assert.match(content, /:::knowledge/);
  assert.match(content, /layout:\s+stack/i);
  assert.match(content, /layout:\s+paired-rows/i);
  assert.match(content, /hint:/i);
  assert.doesNotMatch(content, /:::ranking/);
  assert.doesNotMatch(content, /:::scenario/);
  assert.doesNotMatch(content, /:::decision-tree/);
  assert.doesNotMatch(content, /Item purchased or item you are considering/i);
  assert.match(content, /The Price of Cool: Joe vs\. Sally/i);
  assert.match(content, /:::simulator/);
  assert.match(content, /:::submission/);
  assert.equal(blueprint.target, "brightspace-embed");
  assert.ok(Array.isArray(blueprint.patternDecisions));
  assert.equal(
    blueprint.patternDecisions.find((entry) => entry.sectionId === "budget-builder")?.patternId,
    "mini-simulator"
  );
  assert.equal(blueprint.sourceCoverage.sectionsCovered, 1);
});
