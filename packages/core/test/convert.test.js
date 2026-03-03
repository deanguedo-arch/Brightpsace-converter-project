import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { convertUnitFromSource } from "../src/convert.js";

test("convertUnitFromSource converts CALM Module 1 sources into a premium unit draft", async () => {
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
  const resourcesCopy = path.join(unitDir, "resources", "calm-module-1.txt");
  const content = await fs.readFile(contentPath, "utf8");

  assert.equal(result.courseSlug, "calm-course");
  assert.equal(result.unitSlug, "module-1-v2");
  assert.match(content, /## Module Launch/);
  assert.match(content, /Relationship Progression/i);
  assert.match(content, /Alcohol Awareness/i);
  assert.match(content, /Inside Out/i);
  assert.match(content, /:::submission/);
  assert.equal(await fs.stat(resourcesCopy).then((stats) => stats.isFile()), true);
});

test("convertUnitFromSource falls back to compile for unknown sources", async () => {
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
  const content = await fs.readFile(contentPath, "utf8");
  assert.match(content, /:::scenario/);
  assert.match(content, /:::workbook/);
});

test("convertUnitFromSource converts CALM Module 2 sources into a resource choices unit draft", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cf-convert-module-2-"));
  const sourceDir = path.join(root, "source");
  await fs.mkdir(sourceDir, { recursive: true });

  const sourceFile = path.join(sourceDir, "calm-module-2.txt");
  await fs.writeFile(
    sourceFile,
    [
      "Career and Life Management",
      "Module 2",
      "Resource Choices",
      "",
      "Resources: Who Decides What You Buy",
      "Advertising and Consumerism",
      "How might friends or family influence what you spend your money on?",
      "Identify one store you like to shop from or brand you like to buy.",
      "",
      "Resources: What are you Waiting For?",
      "Joe gets a job as a clerk at Wal-Mart.",
      "Sally bought a used Ford Escort.",
      "",
      "Resources: Managing your Money",
      "Where does your money come from?",
      "At the end of the month, are you saving money or going into debt?",
      "",
      "Resources: Maintaining Positive Relationships",
      "Norma sees a wealthy person drop money while exiting a limousine.",
      "Joe lent Craig, his best friend, $100 six weeks ago."
    ].join("\n"),
    "utf8"
  );

  const result = await convertUnitFromSource({
    repoRoot: root,
    sourcePath: sourceFile,
    courseSlug: "calm-course",
    unitSlug: "module-2-v2",
    extract: false
  });

  const unitDir = path.join(root, "courses", "calm-course", "units", "module-2-v2");
  const contentPath = path.join(unitDir, "content.md");
  const content = await fs.readFile(contentPath, "utf8");

  assert.equal(result.courseSlug, "calm-course");
  assert.equal(result.unitSlug, "module-2-v2");
  assert.match(content, /## Module Launch/);
  assert.match(content, /Spending Influences/i);
  assert.match(content, /Joe vs\. Sally/i);
  assert.match(content, /Budget Builder/i);
  assert.match(content, /Honesty and Relationship Cases/i);
  assert.match(content, /Student Name/i);
  assert.match(content, /:::knowledge/);
  assert.match(content, /layout:\s+budget-grid/i);
  assert.match(content, /layout:\s+case-stack/i);
  assert.match(content, /hint:/i);
  assert.match(content, /:::ranking/);
  assert.match(content, /:::scenario/);
  assert.match(content, /:::submission/);
});
