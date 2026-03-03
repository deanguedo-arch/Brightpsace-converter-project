import { slugify } from "./utils.js";

export const DEFAULT_TEMPLATE_PRESET = "premium-core";
export const DEFAULT_THEME_PRESET = "bold-clay";

function premiumCoreTemplate(unitTitle) {
  return `## Start Here

Welcome to ${unitTitle}. Replace this text with your unit introduction.

:::info
Add context that helps learners understand why this unit matters.
:::

## Core Content

Use markdown for narrative content and directives for callouts, accordions, and workbook fields.

:::accordion
- Prompt 1: Add the first expandable content block.
- Prompt 2: Add the second expandable content block.
:::

:::workbook
title: Quick Practice
description: Capture short answers before moving on.
fields:
  - type: text
    label: What is one decision you will make differently this week?
  - type: radio
    label: Confidence level
    options:
      - Low
      - Medium
      - High
:::

## Reflection

Add a short reflection, checklist, or action prompt for the learner.
`;
}

function guidedWorkbookTemplate(unitTitle) {
  return `## Module Launch

Welcome to ${unitTitle}. Use this guided workbook to move section by section and capture your answers as you go.

:::workbook
title: Student Setup
layout: split
fields:
  - type: text
    id: student-name
    label: Student Name
  - type: textarea
    id: launch-goal
    label: What is one decision pattern you want to improve in this unit?
    hint: Name one habit, spending choice, or communication move you want to handle better.
    autosize: true
:::

## Learn The Pattern

:::knowledge
title: Why This Matters
body: |
  Add a short instructional drop that explains the core pattern before the learner starts writing.
:::

:::workbook
title: Guided Notes
fields:
  - type: textarea
    label: What idea stands out most so far?
    hint: Write one clear sentence before moving on.
    autosize: true
:::

## Review & Submit

:::submission
title: Review & Submit
description: Confirm your sections are complete, then export your teacher-view text file.
:::
`;
}

function caseStudioTemplate(unitTitle) {
  return `## Case Brief

${unitTitle} starts with a realistic scenario. Highlight the stakes and context in 3-5 lines.

:::info
State what the learner should notice before selecting a response.
:::

## Decision Lab

:::scenario
title: Case Simulation
description: Pick a response and review the likely outcome.
prompts:
  - id: case-1
    question: What is the most effective first move in this situation?
    options:
      - label: Pause and gather facts before acting.
        outcome: Strong choice. This lowers risk and increases clarity.
      - label: React quickly without checking assumptions.
        outcome: High risk. You may miss key signals.
:::

## Priority Stack

:::ranking
title: Rank the Next Actions
instructions: Rank from most critical (1) to least critical.
items:
  - Confirm constraints
  - Ask for missing information
  - Draft a response plan
:::

## Debrief

:::workbook
title: Case Debrief Notes
description: Capture what you will apply in real work.
fields:
  - type: textarea
    label: What signal changed your decision?
    rows: 4
  - type: text
    label: One behavior you will change this week
:::
`;
}

function workshopSprintTemplate(unitTitle) {
  return `## Sprint Kickoff

Welcome to ${unitTitle}. Set a single measurable outcome for this learning sprint.

:::workbook
title: Sprint Goal
fields:
  - type: text
    label: What will success look like at the end of this unit?
:::

## Practice Rounds

:::accordion
- Round 1: Add a short challenge and expected response.
- Round 2: Add a second challenge with a tighter constraint.
- Round 3: Add one stretch challenge for advanced learners.
:::

## Coaching Checkpoint

:::scenario
title: Live Coaching Prompt
prompts:
  - id: checkpoint-1
    question: A teammate gets stuck midway. What coaching response helps most?
    options:
      - label: Ask a focused question to unblock the next step.
        outcome: Correct. Questions build ownership and momentum.
      - label: Take over and complete it for them.
        outcome: Fast, but weak for long-term skill transfer.
:::
`;
}

function reflectionCoachTemplate(unitTitle) {
  return `## Grounding

${unitTitle} uses reflection-first pacing. Start with a short story or recent experience.

:::workbook
title: Reflection Journal
fields:
  - type: textarea
    label: What pattern have you noticed in your recent choices?
    rows: 4
  - type: checklist
    label: Which supports are active right now?
    options:
      - Trusted person
      - Structured routine
      - Clear boundaries
:::

## Reframe

:::accordion
- Trigger: What usually starts the cycle?
- Reframe: What is a healthier interpretation?
- Response: What action keeps you aligned?
:::

## Commit

:::workbook
title: Next Step Contract
fields:
  - type: text
    label: One commitment you will complete in the next 24 hours
:::
`;
}

function capstoneAssessmentTemplate(unitTitle) {
  return `## Capstone Overview

${unitTitle} finishes with an application-focused assessment. Define the performance standard first.

:::info
Describe what strong evidence looks like for completion.
:::

## Scenario Assessment

:::scenario
title: Applied Judgment
prompts:
  - id: capstone-1
    question: You identify a risk that affects the whole team. What is your best next move?
    options:
      - label: Escalate with concise evidence and a mitigation proposal.
        outcome: Strong. It balances speed, clarity, and accountability.
      - label: Wait for someone else to notice.
        outcome: Weak. Delays increase impact and uncertainty.
:::

## Path Assessment

:::decision-tree
title: Consequence Pathway
nodes:
  - id: start
    prompt: Choose your response mode.
    choices:
      - label: Proactive
        next: proactive
      - label: Reactive
        next: reactive
  - id: proactive
    prompt: You reduce risk and improve outcomes.
    end: true
  - id: reactive
    prompt: You lose control of timing and quality.
    end: true
:::

## Submission Notes

:::workbook
title: Final Evidence
fields:
  - type: textarea
    label: Summarize your final recommendation and why it meets the standard.
    rows: 5
:::
`;
}

const TEMPLATE_PRESETS = [
  {
    slug: "guided-workbook",
    name: "Guided Workbook",
    description: "Workbook-first pacing with launch setup, knowledge drops, and stronger review flow.",
    buildContent: guidedWorkbookTemplate
  },
  {
    slug: "premium-core",
    name: "Premium Core",
    description: "Balanced narrative, interaction, and reflection flow.",
    buildContent: premiumCoreTemplate
  },
  {
    slug: "case-studio",
    name: "Case Studio",
    description: "Case-driven structure with scenario and ranking blocks.",
    buildContent: caseStudioTemplate
  },
  {
    slug: "workshop-sprint",
    name: "Workshop Sprint",
    description: "Fast skill-building format with coaching checkpoints.",
    buildContent: workshopSprintTemplate
  },
  {
    slug: "reflection-coach",
    name: "Reflection Coach",
    description: "Journal-forward pacing for personal behavior change.",
    buildContent: reflectionCoachTemplate
  },
  {
    slug: "capstone-assessment",
    name: "Capstone Assessment",
    description: "Assessment-heavy sequence for end-of-unit evaluation.",
    buildContent: capstoneAssessmentTemplate
  }
];

const THEME_PRESETS = [
  {
    slug: "clay-workbook",
    name: "Clay Workbook",
    description: "Reference-driven soft slate clay cards with tactile workbook controls."
  },
  {
    slug: "bold-clay",
    name: "Bold Clay",
    description: "Warm premium depth with tactile cards and strong accents."
  },
  {
    slug: "cupertino-light",
    name: "Cupertino Light",
    description: "Ultra-clean neutral surfaces inspired by modern product design."
  },
  {
    slug: "obsidian-pro",
    name: "Obsidian Pro",
    description: "Dark cinematic palette with high-contrast editorial typography."
  },
  {
    slug: "linen-editorial",
    name: "Linen Editorial",
    description: "Soft ivory paper tone with calm luxury contrast."
  },
  {
    slug: "neon-signal",
    name: "Neon Signal",
    description: "High-energy modern contrast with vivid action accents."
  }
];

function normalizePresetValue(value) {
  return slugify(value);
}

function presetNotFound(kind, rawValue, items) {
  const list = items.map((item) => item.slug).join(", ");
  const shown = String(rawValue || "").trim() || "(empty)";
  return new Error(`Unknown ${kind} preset "${shown}". Available ${kind} presets: ${list}`);
}

function findPreset(items, value, fallbackSlug, kind) {
  const normalized = normalizePresetValue(value);
  const target = normalized || fallbackSlug;
  const hit = items.find((item) => item.slug === target);
  if (!hit) throw presetNotFound(kind, value, items);
  return hit;
}

export function listTemplatePresets() {
  return TEMPLATE_PRESETS.map(({ slug, name, description }) => ({ slug, name, description }));
}

export function listThemePresets() {
  return THEME_PRESETS.map(({ slug, name, description }) => ({ slug, name, description }));
}

export function resolveTemplatePreset(value) {
  return findPreset(TEMPLATE_PRESETS, value, DEFAULT_TEMPLATE_PRESET, "template");
}

export function resolveThemePreset(value) {
  return findPreset(THEME_PRESETS, value, DEFAULT_THEME_PRESET, "theme");
}

export function buildTemplateContent(templateSlug, unitTitle) {
  const preset = resolveTemplatePreset(templateSlug);
  return preset.buildContent(unitTitle);
}
