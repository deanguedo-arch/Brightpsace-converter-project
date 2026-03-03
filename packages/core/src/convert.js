import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { ensureDir, listFilesRecursive, writeFileEnsuringDir } from "./fs.js";
import { initUnitScaffold } from "./scaffold.js";
import { extractTextByExtension } from "./extractText.js";
import { slugify } from "./utils.js";
import { compileUnitFromSource } from "./compile.js";
import { normalizeSourceMaterial } from "./sourceNormalization.js";
import { renderGuidedUnit } from "./renderGuidedUnit.js";
import { loadDesignOverrides } from "./designPolicy.js";

const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown"]);
const TEXT_EXTENSIONS = new Set([".txt"]);
const EXTRACTABLE_EXTENSIONS = new Set([".docx", ".pdf"]);

function q(value) {
  return JSON.stringify(String(value || "").trim());
}

function fixCommonPdfEncoding(raw) {
  return String(raw || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, "\"")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2022\u00B7]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ");
}

function normalizeLines(rawText) {
  const fixed = fixCommonPdfEncoding(rawText)
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");

  return fixed
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
}

function isNoiseLine(line) {
  const value = String(line || "").trim();
  if (!value) return true;
  if (/^CALM MODULE/i.test(value)) return true;
  if (/^OUTREACH PROGRAMS/i.test(value)) return true;
  if (/^nextstepfort/i.test(value)) return true;
  if (/^\d+$/.test(value)) return true;
  if (/^SENIOR HIGH SCHOOL$/i.test(value)) return true;
  return false;
}

function stripUnderscores(value) {
  return String(value || "")
    .replace(/_{5,}.*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isUnderlineOnly(line) {
  return /^_{5,}$/.test(String(line || "").trim());
}

function cleanPromptLabel(value) {
  return stripUnderscores(value)
    .replace(/^\d+\.\s+/, "")
    .trim();
}

function toRelative(root, absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

function looksLikeContentFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return MARKDOWN_EXTENSIONS.has(extension) || TEXT_EXTENSIONS.has(extension);
}

function normalizeText(raw) {
  return fixCommonPdfEncoding(raw)
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractRelationshipSteps(text) {
  const match = String(text || "").match(/Relationship Progression Activity([\s\S]*?)Remember:/i);
  if (!match) return [];

  const block = match[1] || "";
  const lines = normalizeLines(block)
    .filter((line) => !isNoiseLine(line))
    .filter((line) => !isUnderlineOnly(line))
    .map((line) => stripUnderscores(line))
    .filter(Boolean);

  const firstStepIndex = lines.findIndex((line) => /^Intercourse$/i.test(line));
  const candidate = firstStepIndex >= 0 ? lines.slice(firstStepIndex) : lines.slice(-16);

  const seen = new Set();
  const items = [];
  for (const raw of candidate) {
    const label = String(raw || "")
      .replace(/^["']+|["']+$/g, "")
      .replace(/"/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(label);
  }
  return items;
}

function extractInsideOutQuestions(text, limit = 10) {
  const match = String(text || "").match(/Summative Task B:\s*["']?Inside Out["']?\s*Film Study([\s\S]*)$/i);
  if (!match) return [];

  const blockLines = normalizeLines(match[1] || "")
    .filter((line) => !isNoiseLine(line));
  const questions = [];
  let current = "";

  for (const raw of blockLines) {
    const line = String(raw || "").trim();
    if (!line) continue;

    const m = line.match(/^(\d{1,2})\.\s+(.+)$/);
    if (m) {
      if (current) {
        questions.push(current.trim());
        if (questions.length >= limit) return questions;
      }
      current = m[2].trim();
      continue;
    }

    if (!current) continue;
    current = `${current} ${line}`.replace(/\s+/g, " ").trim();
  }

  if (current && questions.length < limit) {
    questions.push(current.trim());
  }

  return questions.slice(0, limit);
}

function looksLikeCalmModule1(text) {
  const value = String(text || "");
  return /Career\s+and\s+Life\s+Management/i.test(value)
    && /Module\s*1/i.test(value)
    && /Personal Choices/i.test(value);
}

function looksLikeCalmModule2(text) {
  const value = String(text || "");
  return /Career\s+and\s+Life\s+Management/i.test(value)
    && /Module\s*2/i.test(value)
    && /Resource Choices/i.test(value);
}

function buildCalmModule1Content(text) {
  const relationshipSteps = extractRelationshipSteps(text);
  const insideOutQuestions = extractInsideOutQuestions(text, 10);

  const relationshipYamlItems = (relationshipSteps.length >= 2 ? relationshipSteps : [
    "Flirting",
    "Basic Communication (Shared interests)",
    "Trust",
    "Dating",
    "Steady dating",
    "Long-term commitment",
    "Birth control and STI protection",
    "Intercourse"
  ]).map((item) => `  - ${q(item)}`).join("\n");

  const insideOutFields = (insideOutQuestions.length > 0 ? insideOutQuestions : [
    "Which emotion(s) do you feel most often? Explain.",
    "Have you been through a big transition? Explain.",
    "What might your core memories be?"
  ]).map((question) => {
    return [
      "  - type: textarea",
      `    label: ${q(cleanPromptLabel(question))}`,
      "    rows: 4"
    ].join("\n");
  }).join("\n");

  return `## Module Launch

Welcome to **CALM Module 1: Personal Choices**. This unit is built from your PDF workbook and reorganized into a single-scroll interactive experience.

:::info
How to use this unit:
- Work section by section.
- Keep answers specific (actions, timelines, supports).
- Export your teacher view at the end.
:::

:::warning
If any topic connects to immediate harm, abuse, self-harm, or unsafe substance use, stop and contact a trusted adult or local emergency services.
:::

## Personal Inventory

:::workbook
title: What Works For Me Snapshot
description: Capture your current patterns before you set goals.
fields:
  - type: text
    label: How much sleep do you need each night to function well?
  - type: text
    label: What time of day do you have the most energy?
  - type: text
    label: What time of day do you have the least energy?
  - type: textarea
    label: What activities help you relax?
    rows: 3
  - type: textarea
    label: How do you keep your school work organized?
    rows: 3
  - type: radio
    label: When you're working, are electronics mostly helpful or distracting?
    options:
      - Helpful
      - Distracting
      - Depends on the task
:::

## Relationship Progression

:::ranking
title: Relationship Progression Activity
instructions: Rank how you think a relationship should progress (1 = earliest, higher numbers = later).
items:
${relationshipYamlItems}
:::

:::workbook
title: Relationship Reflection
fields:
  - type: textarea
    label: What was easiest about the relationship progression activity? Explain.
    rows: 4
  - type: textarea
    label: What was most difficult about the relationship progression activity? Explain.
    rows: 4
  - type: textarea
    label: Where do your ideas about a "normal" relationship come from?
    rows: 4
:::

## Alcohol Awareness

:::workbook
title: Alcohol Awareness Check-In
fields:
  - type: textarea
    label: Why do you think people drink?
    rows: 3
  - type: textarea
    label: What do you think about alcohol? Explain.
    rows: 3
  - type: textarea
    label: What would you do or say if you were offered a drink? Explain.
    rows: 3
:::

:::scenario
title: Offered A Drink
description: Choose the response that protects your health, safety, and goals.
prompts:
  - id: offered-drink
    question: Someone offers you a drink and pressures you to fit in. What is the best first move?
    options:
      - label: Say no clearly and suggest an alternative (food, water, different plan).
        outcome: Strong. Clear boundaries reduce pressure and protect safety.
      - label: Take it to avoid being judged.
        outcome: High risk. Approval-seeking can override your goals and safety.
:::

## Summative Task: Inside Out Film Study

:::workbook
title: Inside Out Film Study Notes
description: Answer any prompts your teacher assigned. Keep responses evidence-based and specific.
fields:
${insideOutFields}
:::

## Review & Submit

:::submission
title: Review & Submit
description: Confirm completion, then export your teacher view.
:::
`;
}

function buildCalmModule2Content() {
  return `## Module Launch

Welcome to **CALM Module 2: Resource Choices**. This guided workbook keeps the source sequence intact while giving you clearer prompts, stronger pacing, and a cleaner export at the end.

:::workbook
title: Student Setup
layout: split
description: Start with your name and one decision pattern you want to improve during this module.
fields:
  - type: text
    id: student-name
    label: ${q("Student Name")}
  - type: textarea
    id: launch-focus
    label: ${q("What is one spending or relationship decision pattern you want to improve in this unit?")}
    hint: ${q("Think about ads, money habits, honesty, conflict, or impulse buying.")}
    autosize: true
    rows: 4
:::

## Spending Influences

Advertising is designed to influence your choices, feelings, and behaviour. Strong consumers learn to name the pressure before they spend.

:::knowledge
title: ${q("Influences in Marketing")}
open: true
body: |
  Marketing and packaging are not neutral. They are designed to shape attention, emotion, and buying behaviour. Before you answer the workbook prompts, identify what usually pushes you toward a purchase: advertising, social approval, convenience, routine, or lifestyle image.
:::

:::workbook
title: Spending Influence Audit
description: Capture the patterns that most affect your buying decisions.
fields:
  - type: text
    label: ${q("Define marketing in your own words.")}
  - type: text
    label: ${q("Define packaging in your own words.")}
  - type: textarea
    label: ${q("How might friends or family influence what you spend money on? Use one example from your own life.")}
    hint: ${q("Name a real purchase where someone else's opinion affected your choice.")}
    autosize: true
    rows: 4
  - type: textarea
    label: ${q("Identify one store or brand you return to often. Why do you usually buy from them?")}
    hint: ${q("Think about trust, style, convenience, price, or habit.")}
    autosize: true
    rows: 4
  - type: textarea
    label: ${q("Which influence affects your spending the most right now, and why?")}
    hint: ${q("Choose one main pressure instead of listing everything.")}
    autosize: true
    rows: 4
:::

:::ranking
title: Rank The Biggest Spending Influences
instructions: Rank these from strongest influence on your current spending to weakest.
items:
  - ${q("Advertising and marketing")}
  - ${q("Opinions of friends or family")}
  - ${q("Habit and familiarity")}
  - ${q("Lifestyle changes")}
  - ${q("Personal expectations and values")}
:::

:::scenario
title: What Is Driving The Purchase?
description: Choose the factor that best explains each situation.
prompts:
  - id: trendy-shoes
    question: ${q("You buy a specific shoe brand because everyone in your friend group is wearing it. What is the main influence?")}
    options:
      - label: ${q("Peer and significant-other influence")}
        outcome: ${q("Yes. Social approval and belonging are driving the decision.")}
      - label: ${q("Pure product research")}
        outcome: ${q("Not likely. The strongest signal here is social pressure, not careful comparison.")}
  - id: same-store
    question: ${q("You always go back to the same store because the last few purchases worked out well. What is the main influence?")}
    options:
      - label: ${q("Habit")}
        outcome: ${q("Correct. Repeated satisfactory purchases often create automatic buying patterns.")}
      - label: ${q("Lifestyle change")}
        outcome: ${q("Less accurate. Nothing in the prompt suggests a major life shift is driving the purchase.")}
:::

## Joe vs. Sally

The workbook contrasts a high-cost "cool" purchase with a lower-cost transportation decision plus steady investing.

:::knowledge
title: ${q("The Price of Cool: Joe vs. Sally")}
body: |
  Joe chooses image first and locks himself into years of payments. Sally chooses a lower-cost vehicle and uses the monthly difference to build future stability. The point is not the specific car. The point is how one choice creates debt pressure while the other creates options.
:::

:::workbook
title: The Price Of Cool
fields:
  - type: textarea
    label: ${q("Why do you think Joe bought a new Camaro? Explain your thinking.")}
    hint: ${q("Consider status, image, attention, and instant gratification.")}
    autosize: true
    rows: 4
  - type: textarea
    label: ${q("Why do you think Sally bought a used Escort? Explain your thinking.")}
    hint: ${q("Think about flexibility, cost control, and future goals.")}
    autosize: true
    rows: 4
  - type: textarea
    label: ${q("Who made the better long-term decision? Explain your thinking.")}
    autosize: true
    rows: 4
:::

:::decision-tree
title: Cost Of A Choice
description: Follow the trade-off between image, debt, flexibility, and future assets.
nodes:
  - id: start
    prompt: ${q("You have savings and want a car. What matters more right now?")}
    choices:
      - label: ${q("Looking impressive immediately")}
        next: financed
      - label: ${q("Keeping options open and building stability")}
        next: practical
  - id: financed
    prompt: ${q("A financed purchase creates monthly payments, interest, and less flexibility when life changes.")}
    choices:
      - label: ${q("Accept the long-term cost for the short-term image")}
        next: debt
      - label: ${q("Reconsider and lower the cost of the purchase")}
        next: practical
  - id: debt
    prompt: ${q("The item loses novelty, but the payment commitment stays.")}
    end: true
  - id: practical
    prompt: ${q("A lower-cost decision preserves money for saving, investing, or unexpected expenses.")}
    end: true
:::

## Purchase Research

Before buying something significant, the workbook asks you to slow down and research the choice.

:::workbook
title: Smart Purchase Check
description: Test one real purchase against the worksheet's consumer checklist.
fields:
  - type: text
    label: ${q("Item purchased or item you are considering")}
  - type: checklist
    label: ${q("Which research steps did you complete before buying?")}
    options:
      - ${q("I asked whether I actually need it")}
      - ${q("I checked if it could be borrowed, rented, or replaced by something I already own")}
      - ${q("I compared prices and quality")}
      - ${q("I checked return, exchange, or refund rules")}
      - ${q("I looked for hidden costs like fees, insurance, or maintenance")}
      - ${q("I asked questions before buying")}
  - type: textarea
    label: ${q("Do you think enough research was done before this purchase? Why or why not?")}
    hint: ${q("Mention at least one thing that was checked and one thing that was missed.")}
    autosize: true
    rows: 4
:::

:::scenario
title: Consumer Checkpoint
description: Choose the stronger consumer move.
prompts:
  - id: sale-item
    question: ${q("A sale item looks cheap, but you are not sure whether the store only offers in-store credit. What is the strongest move?")}
    options:
      - label: ${q("Buy it now before the sale ends and figure out returns later")}
        outcome: ${q("Weak consumer judgment. Return rules can completely change whether a 'deal' is worth it.")}
      - label: ${q("Check the return, refund, and receipt policy before paying")}
        outcome: ${q("Strong. Policy details matter as much as sticker price.")}
  - id: hidden-costs
    question: ${q("A product fits your budget upfront, but it may involve extra fees later. What should you do?")}
    options:
      - label: ${q("Count only the purchase price")}
        outcome: ${q("Weak. Big decisions get distorted when ongoing costs are ignored.")}
      - label: ${q("Estimate the full cost, including follow-up expenses")}
        outcome: ${q("Correct. Good consumer decisions account for total cost, not just initial price.")}
:::

## Budget Builder

:::workbook
title: Monthly Budget Builder
layout: budget-grid
description: Build a current monthly budget using the same categories from the source workbook.
fields:
  - type: text
    label: ${q("Income from job")}
  - type: text
    label: ${q("Income from parents or family")}
  - type: text
    label: ${q("Other income (scholarship, grant, gifts, side work)")}
  - type: text
    label: ${q("Rent or room and board")}
  - type: text
    label: ${q("Utilities")}
  - type: text
    label: ${q("Phone")}
  - type: text
    label: ${q("Groceries")}
  - type: text
    label: ${q("Car payments")}
  - type: text
    label: ${q("Insurance")}
  - type: text
    label: ${q("Gas or transportation")}
  - type: text
    label: ${q("Entertainment")}
  - type: text
    label: ${q("Dining or snacking out")}
  - type: text
    label: ${q("Clothes")}
  - type: text
    label: ${q("Other expenses")}
  - type: textarea
    label: ${q("Where does most of your money come from?")}
    autosize: true
    rows: 3
  - type: textarea
    label: ${q("Where does most of your money go?")}
    autosize: true
    rows: 3
  - type: textarea
    label: ${q("At the end of the month, are you saving money or going into debt? What are your plans?")}
    hint: ${q("Name whether you are ahead, even, or behind, then state your next adjustment.")}
    autosize: true
    rows: 4
  - type: textarea
    label: ${q("Looking at your budget, what is one thing you would like to do differently?")}
    autosize: true
    rows: 4
:::

## Honesty and Relationship Cases

:::knowledge
title: ${q("Healthy Relationships")}
body: |
  The workbook links honesty to trust, respect, listening, shared time, and accepting boundaries. The honesty scenarios below are not just about rules. They are about what kind of person and relationship you are building.
:::

:::scenario
title: Honesty Quiz
description: Choose the response that best protects integrity and trust.
prompts:
  - id: norma
    question: ${q("Norma finds $100 after a wealthy person drops it. She needs rent money. What is the stronger choice?")}
    options:
      - label: ${q("Keep it because she needs it more")}
        outcome: ${q("Self-justifying reasoning may feel understandable, but it still ignores honesty and ownership.")}
      - label: ${q("Try to return it or report it")}
        outcome: ${q("Stronger integrity choice. Need does not automatically erase accountability.")}
  - id: asif
    question: ${q("Asif gets too much change back at a store and notices after leaving. What is the stronger choice?")}
    options:
      - label: ${q("Keep it because the mistake was not his")}
        outcome: ${q("Weak. The source workbook frames this as an honesty test, not a convenience test.")}
      - label: ${q("Return the extra money when possible")}
        outcome: ${q("Stronger. Honest relationships and communities depend on returning what is not yours.")}
  - id: frank
    question: ${q("Frank finds an iPhone at school and knows someone who could unlock it. What is the stronger choice?")}
    options:
      - label: ${q("Keep it because nobody saw him find it")}
        outcome: ${q("Weak. Privacy and ownership still matter even when there are no witnesses.")}
      - label: ${q("Turn it in so it can be returned")}
        outcome: ${q("Correct. Accountability matters more than personal opportunity.")}
:::

:::workbook
title: Honesty Reflection
fields:
  - type: textarea
    label: ${q("When is it important to be honest? Describe situations.")}
    autosize: true
    rows: 4
  - type: textarea
    label: ${q("When is it acceptable to omit the truth or hold something back? Describe situations.")}
    autosize: true
    rows: 4
  - type: textarea
    label: ${q("Which honesty scenario was easiest for you to decide, and why?")}
    autosize: true
    rows: 3
  - type: textarea
    label: ${q("Which honesty scenario was hardest for you to decide, and why?")}
    autosize: true
    rows: 3
  - type: textarea
    label: ${q("Do you believe honesty is important to healthy relationships? Why or why not?")}
    autosize: true
    rows: 4
:::

## Conflict and Communication

:::knowledge
title: ${q("Conflict: A Fact of Life")}
body: |
  Conflict is normal. What matters is whether you escalate it or handle it with clarity. Stronger communication usually means calmer tone, listening first, staying specific, and addressing the issue instead of attacking the person.
:::

:::workbook
title: Conflict Reflection
layout: case-stack
fields:
  - type: text
    label: ${q("Define conflict in your own words")}
  - type: textarea
    label: ${q("Think of a conflict with a friend or family member. What were you arguing about?")}
    autosize: true
    rows: 3
  - type: textarea
    label: ${q("How did you try to resolve the conflict?")}
    autosize: true
    rows: 3
  - type: textarea
    label: ${q("Was your approach effective? Why or why not?")}
    autosize: true
    rows: 3
:::

:::accordion
- Poor skill: Yelling, interrupting, or trying to win usually raises the emotional charge and blocks resolution.
- Stronger skill: Calm tone, listening first, considering the other person's perspective, and staying specific lower the temperature and improve the odds of a solution.
- Case lab: The workbook finishes with real situations about money, boundaries, and concern for a friend. Good responses balance honesty, care, and direct communication.
:::

:::workbook
title: Case Study Response Lab
layout: case-stack
description: Write your first move for each situation.
fields:
  - type: textarea
    label: ${q("Joe lent Craig $100 six weeks ago. How should Joe handle the situation, and why?")}
    hint: ${q("Aim for direct communication, not avoidance or aggression.")}
    autosize: true
    rows: 4
  - type: textarea
    label: ${q("Amanda no longer wants to cover for Joanne. How should Amanda handle the situation, and why?")}
    autosize: true
    rows: 4
  - type: textarea
    label: ${q("Maya is worried about Leticia's eating and body image. How should Maya raise the issue, and why?")}
    autosize: true
    rows: 4
:::

## Review & Submit

:::submission
title: Review & Submit
description: Confirm each section is complete, then export your teacher-view text file for Brightspace submission.
:::
`;
}

function buildConvertedUnitConfig({
  converter,
  title
}) {
  if (converter === "calm-module-2") {
    return {
      slug: "module-2-v2",
      title,
      subtitle: "Advertising, budgeting, consumer decisions, honesty, and conflict",
      estimatedMinutes: 120,
      template: "guided-workbook",
      theme: "clay-workbook",
      objectives: [
        "Analyze how advertising, peers, habit, and lifestyle influence spending choices.",
        "Compare short-term image purchases with stronger long-term money decisions.",
        "Use purchase research questions and a monthly budget to make better consumer choices.",
        "Apply honesty and communication skills to real relationship and conflict cases."
      ]
    };
  }

  return {
    title,
    template: "premium-core",
    theme: "bold-clay"
  };
}

async function writeConvertedUnitConfig(unitDir, config, unitSlug) {
  const unitConfigPath = path.join(unitDir, "unit.yml");
  const unitConfig = {
    slug: unitSlug,
    title: config.title,
    ...(config.subtitle ? { subtitle: config.subtitle } : {}),
    estimatedMinutes: config.estimatedMinutes ?? 20,
    template: config.template || "premium-core",
    theme: config.theme || "bold-clay",
    objectives: Array.isArray(config.objectives) && config.objectives.length > 0
      ? config.objectives
      : [
          "Review the core ideas in this unit.",
          "Complete interactive activities and resources.",
          "Mark complete after practice."
        ]
  };
  await writeFileEnsuringDir(unitConfigPath, yaml.dump(unitConfig));
}

async function collectMaterials(files, extract) {
  const materials = [];
  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (looksLikeContentFile(filePath)) {
      const text = normalizeText(await fs.readFile(filePath, "utf8"));
      if (text) materials.push({ filePath, text });
      continue;
    }
    if (extract && EXTRACTABLE_EXTENSIONS.has(ext)) {
      const text = normalizeText(await extractTextByExtension(filePath).catch(() => ""));
      if (text) materials.push({ filePath, text });
    }
  }
  return materials;
}

export async function convertUnitFromSource({
  repoRoot,
  sourcePath,
  courseSlug,
  unitSlug,
  extract = true,
  target = "brightspace-embed"
}) {
  const normalizedCourseSlug = slugify(courseSlug);
  const normalizedUnitSlug = slugify(unitSlug);
  if (!normalizedCourseSlug) throw new Error("courseSlug is required.");
  if (!normalizedUnitSlug) throw new Error("unitSlug is required.");

  const absoluteSource = path.resolve(repoRoot, sourcePath);
  const sourceStats = await fs.stat(absoluteSource).catch(() => null);
  if (!sourceStats) {
    throw new Error(`Source path not found: ${absoluteSource}`);
  }
  if (!sourceStats.isDirectory() && !sourceStats.isFile()) {
    throw new Error(`Source path must be a file or directory: ${absoluteSource}`);
  }

  const sourceRoot = sourceStats.isDirectory()
    ? absoluteSource
    : path.dirname(absoluteSource);
  const sourceFiles = sourceStats.isDirectory()
    ? await listFilesRecursive(absoluteSource)
    : [absoluteSource];

  const materials = await collectMaterials(sourceFiles, extract);
  const corpus = materials.map((item) => item.text).join("\n\n");

  let converter = "";
  let title = "";
  let content = "";
  let renderResult = null;
  let designOverridesMeta = null;

  if (looksLikeCalmModule1(corpus)) {
    converter = "calm-module-1";
    title = "CALM Module 1: Personal Choices";
    content = buildCalmModule1Content(corpus);
  } else if (looksLikeCalmModule2(corpus)) {
    converter = "calm-module-2";
    title = "CALM Module 2: Resource Choices";
    const plannedUnitDir = path.join(
      repoRoot,
      "courses",
      normalizedCourseSlug,
      "units",
      normalizedUnitSlug
    );
    designOverridesMeta = await loadDesignOverrides({ unitDir: plannedUnitDir });
    const normalizedUnit = normalizeSourceMaterial({
      courseSlug: normalizedCourseSlug,
      unitSlug: normalizedUnitSlug,
      title,
      sourceFiles: sourceFiles.map((filePath) => toRelative(sourceRoot, filePath)),
      corpus
    });
    renderResult = renderGuidedUnit({
      normalizedUnit,
      target,
      designOverrides: designOverridesMeta.overrides
    });
    content = renderResult.content;
  } else {
    return compileUnitFromSource({
      repoRoot,
      sourcePath,
      courseSlug: normalizedCourseSlug,
      unitSlug: normalizedUnitSlug,
      extract,
      target
    });
  }

  const scaffold = await initUnitScaffold({
    repoRoot,
    courseSlug: normalizedCourseSlug,
    unitSlug: normalizedUnitSlug,
    title,
    template: converter === "calm-module-2" ? "guided-workbook" : "premium-core",
    theme: converter === "calm-module-2" ? "clay-workbook" : "bold-clay"
  });

  const unitDir = scaffold.unitDir;
  const resourcesDir = path.join(unitDir, "resources");
  await ensureDir(resourcesDir);
  await writeConvertedUnitConfig(
    unitDir,
    buildConvertedUnitConfig({
      converter,
      title
    }),
    normalizedUnitSlug
  );

  const blueprint = {
    version: 1,
    generatedAt: new Date().toISOString(),
    converter,
    target,
    courseSlug: normalizedCourseSlug,
    unitSlug: normalizedUnitSlug,
    sourceFiles: sourceFiles.map((filePath) => toRelative(sourceRoot, filePath)),
    extractedMaterials: materials.map((item) => toRelative(sourceRoot, item.filePath)),
    ...(renderResult ? {
      patternDecisions: renderResult.patternDecisions,
      sourceCoverage: renderResult.sourceCoverage,
      designPolicy: {
        version: renderResult.designPolicyVersion,
        precedence: renderResult.governancePrecedence,
        overridesFile: designOverridesMeta?.exists ? toRelative(repoRoot, designOverridesMeta.filePath) : "",
        overridesApplied: renderResult.overridesApplied,
        overrideWarnings: designOverridesMeta?.warnings || []
      },
      fingerprints: renderResult.fingerprints
    } : {})
  };

  const blueprintPath = path.join(unitDir, "blueprint.convert.json");
  const contentPath = path.join(unitDir, "content.md");
  await writeFileEnsuringDir(blueprintPath, `${JSON.stringify(blueprint, null, 2)}\n`);
  await writeFileEnsuringDir(contentPath, content);

  for (const filePath of sourceFiles) {
    const rel = toRelative(sourceRoot, filePath);
    const destination = path.join(resourcesDir, rel);
    await ensureDir(path.dirname(destination));
    await fs.copyFile(filePath, destination);
  }

  return {
    courseSlug: normalizedCourseSlug,
    unitSlug: normalizedUnitSlug,
    unitDir,
    blueprintPath,
    contentPath,
    sourceFiles: sourceFiles.map((filePath) => toRelative(sourceRoot, filePath)),
    extractedMaterials: materials.map((item) => toRelative(sourceRoot, item.filePath))
  };
}
