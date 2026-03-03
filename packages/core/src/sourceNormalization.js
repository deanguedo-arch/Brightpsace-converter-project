function normalizeText(raw) {
  return String(raw || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/_{5,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const SMART_BUYER_CHECKLIST_GROUPS = [
  {
    title: "1. Ask yourself before buying",
    items: [
      "Do you need this?",
      "Could it be rented or borrowed?",
      "Could you use something you already had instead?",
      "Can you afford this?",
      "Did you read and gather as much information as you could before choosing the product or service?",
      "Was it the best price for the quality you chose?",
      "Will there be any other costs with this purchase?",
      "Can you return this?"
    ]
  },
  {
    title: "2. Understand advertising and labeling",
    items: [
      "Did you confirm that the item is really being sold for the advertised price, and with the advertised conditions?"
    ]
  },
  {
    title: "3. Ask questions and get answers",
    items: [
      "Did you talk to sales people and ask questions?",
      "If the article is not being sold in a store, did you get the seller's \"promises\" in writing?"
    ]
  },
  {
    title: "4. Shop wisely",
    items: [
      "Did you comparison shop?",
      "Did you check prices from month to month before purchasing the item?",
      "Did you shop out-of-season, e.g. clothing sales at the end of the season?",
      "Did you watch for advertisement of sales?"
    ]
  },
  {
    title: "5. Know a store's return/exchange/refund policy",
    items: [
      "Most stores require a receipt to give a refund or credit.",
      "Items for refund must be in \"store-bought\" condition.",
      "Some stores having sales will not give refunds or credit on sale items.",
      "Some stores only refund for in-store credit."
    ]
  }
];

const HEALTHY_RELATIONSHIP_ITEMS = [
  "listen to you and take your feelings and ideas seriously",
  "talk openly and honestly with you about what matters to them",
  "never use threats of harm, violence or suicide to get his/her own way",
  "never hit, punch, kick, bite, slap, push or otherwise strike out in anger or jealousy",
  "not try to control what you do, where you go or who you talk to",
  "respect you, and say good things to you and about you",
  "enjoy spending time with you, and show it whether alone with you or in a group",
  "trust you, and earn your trust by keeping your confidences",
  "allow you to enjoy the activities and people that matter to you",
  "accepts your limits about sexual activity, every time"
];

function normalizeLines(raw) {
  return normalizeText(raw)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function matchLine(line, matcher) {
  if (matcher instanceof RegExp) return matcher.test(line);
  if (typeof matcher === "function") return matcher(line);
  return line === String(matcher || "").trim();
}

function findLineIndex(lines, matcher, startIndex = 0) {
  for (let index = startIndex; index < lines.length; index += 1) {
    if (matchLine(lines[index], matcher)) return index;
  }
  return -1;
}

function getLineSlice(text, startMarker, endMarkers = [], options = {}) {
  const lines = normalizeLines(text);
  const rawStartIndex = findLineIndex(lines, startMarker);
  if (rawStartIndex < 0) return "";
  const startIndex = options.includeStart ? rawStartIndex : rawStartIndex + 1;
  let endIndex = lines.length;
  for (const marker of endMarkers) {
    const candidate = findLineIndex(lines, marker, startIndex);
    if (candidate >= 0 && candidate < endIndex) {
      endIndex = candidate;
    }
  }
  return lines.slice(startIndex, endIndex).join("\n").trim();
}

function repairExtractedLine(raw) {
  return String(raw || "")
    .replace(/[•·▪◦■□▮▯]/g, " ")
    .replace(/[ï‚·]/g, " ")
    .replace(/\bCould you of use\b/gi, "Could you use")
    .replace(/\bread and gathered\b/gi, "read and gather")
    .replace(/\bin store credit\b/gi, "in-store credit")
    .replace(/\bstore bought\b/gi, "store-bought")
    .replace(/\bliving a home\b/gi, "living at home")
    .replace(/\bwhich the racing scoop on the hood\b/gi, "with the racing scoop on the hood")
    .replace(/\bso-call\b/gi, "so-called")
    .replace(/\bcare that he doesn't\b/gi, "car that he doesn't")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanListItem(raw) {
  return repairExtractedLine(String(raw || "").replace(/^[\-\u2013\u2014*•·▪◦■□▮▯]+\s*/, ""));
}

function mergeContinuationLines(lines) {
  const merged = [];
  for (const rawLine of lines || []) {
    const line = cleanListItem(rawLine);
    if (!line) continue;

    const previous = merged[merged.length - 1];
    const shouldMerge = previous && (
      /\b(and|or|to|of|in|with|for|a|an|the)$/i.test(previous) ||
      /^[,.;:)\]]/.test(line) ||
      (!/[.?!:]$/.test(previous) && line.split(" ").length <= 4)
    );

    if (shouldMerge) {
      merged[merged.length - 1] = `${previous} ${line}`.replace(/\s+/g, " ").trim();
      continue;
    }

    merged.push(line);
  }
  return merged;
}

function getSlice(text, startMarker, endMarkers = []) {
  const normalized = normalizeText(text);
  const startIndex = normalized.indexOf(startMarker);
  if (startIndex < 0) return "";
  const sliceStart = startIndex + startMarker.length;
  const tail = normalized.slice(sliceStart);
  let endIndex = tail.length;
  for (const marker of endMarkers) {
    const candidate = tail.indexOf(marker);
    if (candidate >= 0 && candidate < endIndex) {
      endIndex = candidate;
    }
  }
  return tail.slice(0, endIndex).trim();
}

function linesBetween(text, startLine, endLine) {
  const lines = normalizeLines(text);
  const startIndex = lines.findIndex((line) => line === startLine);
  if (startIndex < 0) return [];
  const collected = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (lines[index] === endLine) break;
    collected.push(lines[index]);
  }
  return collected;
}

function paragraphize(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return [];
  return lines
    .map((line) => line.trim())
    .filter(Boolean);
}

function stripWorksheetNoise(text, stopPatterns = []) {
  return normalizeLines(text).filter((line) => {
    if (stopPatterns.some((pattern) => pattern.test(line))) return false;
    if (/^_{3,}$/.test(line)) return false;
    return true;
  }).join(" ");
}

function narrativeOnly(text) {
  const lines = normalizeLines(text);
  const stopIndex = lines.findIndex((line) => /^How do you think|^What if /i.test(line));
  return (stopIndex >= 0 ? lines.slice(0, stopIndex) : lines).join(" ");
}

function toQuestion(id, prompt, extra = {}) {
  return {
    id,
    prompt: String(prompt || "").trim(),
    answerKind: extra.answerKind || "textarea",
    rows: extra.rows || 4,
    hint: extra.hint || "",
    options: extra.options || []
  };
}

function buildLaunchSection() {
  return {
    id: "module-launch",
    sourceTitle: "Module Launch",
    normalizedTitle: "Module Launch",
    order: 1,
    blocks: [
      {
        type: "intro",
        text: "Welcome to CALM Module 2: Resource Choices. This Brightspace-first workbook keeps the source material intact while reorganizing it into clearer decision patterns."
      },
      {
        type: "question_set",
        title: "Student Setup",
        questions: [
          {
            id: "student-name",
            prompt: "Student Name",
            answerKind: "text",
            rows: 1
          },
          toQuestion(
            "launch-focus",
            "What is one spending or relationship decision pattern you want to improve in this unit?",
            {
              hint: "Think about ads, money habits, honesty, conflict, or impulse buying."
            }
          )
        ]
      }
    ]
  };
}

function buildSpendingSection(text) {
  const significant = getSlice(text, "The Influences of Significant others.", ["The Influence of Habit."]);
  const habit = getSlice(text, "The Influence of Habit.", ["The Influences of Changes in Lifestyle."]);
  const lifestyle = getSlice(text, "The Influences of Changes in Lifestyle.", ["Influences of Changes in Personal Expectations."]);
  const expectations = getSlice(text, "Influences of Changes in Personal Expectations.", ["Advertising", "On the chart below"]);
  const expectationItems = paragraphize(normalizeLines(expectations)).map((line) => {
    if (line === "Expectations change for various reasons but can include:") return line;
    return line.replace(/^- /, "").trim();
  });

  const significantClean = stripWorksheetNoise(significant, [/^How might friends or family/i]);
  const habitClean = stripWorksheetNoise(habit, [/^Identify one store/i]);
  const lifestyleClean = stripWorksheetNoise(lifestyle);

  return {
    id: "spending-influences",
    sourceTitle: "Resources: Who Decides What You Buy",
    normalizedTitle: "Spending Influences",
    order: 2,
    blocks: [
      {
        type: "intro",
        text: "Advertising and Consumerism. The Canadian Code of Advertising Standards defines Advertising as any paid message communicated with the intent to influence the choice, opinion, or behaviour of those addressed by the commercial messages. Advertising is a form of persuasion, influences feelings, and should be honest, accurate, fair and tasteful."
      },
      {
        type: "question_set",
        title: "Definitions",
        questions: [
          toQuestion("marketing-definition", "Using a dictionary, define the term Marketing.", { rows: 3 }),
          toQuestion("packaging-definition", "Using a dictionary, define the term Packaging.", { rows: 3 })
        ]
      },
      {
        type: "knowledge",
        title: "Influences in Marketing",
        items: [
          `The Influences of Significant others. ${significantClean}`.trim(),
          `The Influence of Habit. ${habitClean}`.trim(),
          `The Influences of Changes in Lifestyle. ${lifestyleClean}`.trim(),
          `Influences of Changes in Personal Expectations. ${expectationItems.join(" ")}`.trim()
        ],
        rawText: [
          `The Influences of Significant others. ${significantClean}`.trim(),
          `The Influence of Habit. ${habitClean}`.trim(),
          `The Influences of Changes in Lifestyle. ${lifestyleClean}`.trim(),
          `Influences of Changes in Personal Expectations. ${expectationItems.join(" ")}`.trim()
        ].filter(Boolean).join("\n\n")
      },
      {
        type: "question_set",
        title: "Personal Audit",
        questions: [
          toQuestion(
            "family-influence",
            "How might friends or family influence what you spend your money on? List and explain one example from your own life."
          ),
          toQuestion(
            "favorite-store",
            "Identify one store you like to shop from or brand you like to buy. Why do you usually buy from them?"
          )
        ]
      },
      {
        type: "table",
        tableKind: "purchase-log",
        title: "Recent Purchases",
        columns: ["Item Purchased", "Influence for Purchase"],
        rows: Array.from({ length: 10 }, (_, index) => [`Item ${index + 1}`, ""]),
        rawText: "On the chart below list 10 items you have purchased in the recent past. For each item on your list, name the influences for the purchase: advertising/marketing, opinions of others, habit, changes in lifestyle, changes of personal expectations."
      },
      {
        type: "reflection",
        title: "Biggest Influence",
        prompts: ["Of the 5 influences, which one do you think influences your spending the most? Explain."]
      }
    ]
  };
}

function buildJoeVsSallySection(text) {
  const intro = getLineSlice(
    text,
    /^Taken from Lifechoices-Venturing out, Pearson Educational Inc\., Pages 11-12\.$/i,
    [/^Joe$/]
  );
  const joe = getLineSlice(text, /^Joe$/, [/^Sally$/]);
  const sally = getLineSlice(text, /^Sally$/, [/^Why do you think Joe bought a new (Camaro|Camero)\?/i]);
  return {
    id: "joe-vs-sally",
    sourceTitle: "Resources: What are you Waiting For?",
    normalizedTitle: "Joe vs. Sally",
    order: 3,
    blocks: [
      {
        type: "intro",
        text: mergeContinuationLines(normalizeLines(intro)).map(repairExtractedLine).join("\n\n")
      },
      {
        type: "scenario",
        title: "Joe",
        prompt: "Joe",
        details: paragraphize(mergeContinuationLines(normalizeLines(joe))),
        rawText: joe
      },
      {
        type: "scenario",
        title: "Sally",
        prompt: "Sally",
        details: paragraphize(mergeContinuationLines(normalizeLines(sally))),
        rawText: sally
      },
      {
        type: "question_set",
        title: "Decision Questions",
        questions: [
          toQuestion("joe-choice", "Why do you think Joe bought a new Camaro? Explain your thinking."),
          toQuestion("sally-choice", "Why do you think Sally bought a used Escort? Explain your thinking."),
          toQuestion("better-decision", "Who do you think made the better decision? Explain your thinking.")
        ]
      }
    ]
  };
}

function buildBudgetSection(researchText, summativeText) {
  const checklistGroups = SMART_BUYER_CHECKLIST_GROUPS.map((group) => ({
    title: group.title,
    items: group.items.map(repairExtractedLine)
  }));
  const checklistLines = checklistGroups.flatMap((group) => group.items);

  return {
    id: "budget-builder",
    sourceTitle: "Resources: Managing your Money / Summative Task: Managing Money",
    normalizedTitle: "Budget Builder",
    order: 4,
    blocks: [
      {
        type: "checklist",
        title: "Smart Buyer Checklist",
        items: checklistLines,
        groups: checklistGroups
      },
      {
        type: "reflection",
        title: "Purchase Reflection",
        prompts: ["Do you think you did enough research into your purchase? Why or why not?"]
      },
      {
        type: "question_set",
        title: "Managing Money Questions",
        questions: [
          toQuestion("current-income", "List your current source(s) of income."),
          toQuestion("future-income", "What do you expect to be your source(s) of income in the near future?"),
          toQuestion("purchase-decision", "How do you decide what to purchase?"),
          toQuestion("purchase-factors", "What factors do you think influence your purchasing decisions?")
        ]
      },
      {
        type: "table",
        tableKind: "budget",
        title: "Monthly Budget Builder",
        columns: ["group", "key", "label"],
        rows: [
          ["income", "job", "Job"],
          ["income", "parents-family", "Parents or Family"],
          ["income", "other-income", "Other (Scholarship, grant, etc.)"],
          ["expense", "rent-room-board", "Rent or Room and Board"],
          ["expense", "utilities", "Utilities (Water & Electricity)"],
          ["expense", "phone", "Phone"],
          ["expense", "groceries", "Groceries"],
          ["expense", "car-payments", "Car Payments"],
          ["expense", "insurance", "Insurance"],
          ["expense", "gas", "Gas"],
          ["expense", "entertainment", "Entertainment (Movies, Cable, etc.)"],
          ["expense", "dining-out", "Dining/Snacking Out"],
          ["expense", "clothes", "Clothes"],
          ["expense", "etc", "Etc."]
        ],
        rawText: summativeText
      },
      {
        type: "reflection",
        title: "Budget Analysis",
        prompts: [
          "Where does most of your money come from?",
          "Where does most of your money go?",
          "At the end of the month, are you saving money or going into debt? What are your plans for the money you save, or the money you owe?",
          "Looking at your budget, what is one thing you would like to do differently? Explain."
        ]
      }
    ]
  };
}

function buildHonestySection(text) {
  const relationshipItems = HEALTHY_RELATIONSHIP_ITEMS.map(repairExtractedLine);
  const questionLines = normalizeLines(getSlice(text, "HONESTY QUIZ", ["DISCUSSION ON HONESTY"])).filter((line) =>
    /^(Norma|Gertrude|Herman|Asif|Frank|Charlotte|Salima)\b/.test(line)
  );
  const reflectionLines = normalizeLines(getSlice(text, "DISCUSSION ON HONESTY", ["Resources: Maintaining Positive Relationships"])).filter((line) =>
    /\?$/.test(line)
  );

  return {
    id: "honesty-and-relationship-cases",
    sourceTitle: "Resources: Relationships",
    normalizedTitle: "Honesty and Relationship Cases",
    order: 5,
    blocks: [
      {
        type: "knowledge",
        title: "Healthy Relationships",
        description: "People in healthy relationships:",
        items: relationshipItems,
        rawText: relationshipItems.join("\n")
      },
      {
        type: "question_set",
        title: "Honesty Quiz",
        questions: questionLines.map((line, index) => toQuestion(`honesty-${index + 1}`, line))
      },
      {
        type: "reflection",
        title: "Honesty Reflection",
        prompts: reflectionLines
      }
    ]
  };
}

function buildConflictSection(text) {
  const communicationBlock = getSlice(text, "Yelling at one another", ["Summative Task"]);
  const communicationLines = communicationBlock
    ? normalizeLines(`Yelling at one another\n${communicationBlock}`)
    : [];

  return {
    id: "conflict-and-communication",
    sourceTitle: "Resources: Maintaining Positive Relationships",
    normalizedTitle: "Conflict and Communication",
    order: 6,
    blocks: [
      {
        type: "question_set",
        title: "Conflict Reflection",
        questions: [
          toQuestion("define-conflict", "Using a dictionary, define conflict.", { rows: 3 }),
          toQuestion("conflict-about", "Think of a time in your life when you were in a conflict with a friend or family member. What were you fighting or arguing about?"),
          toQuestion("conflict-resolve", "How did you try to resolve your conflict?"),
          toQuestion("conflict-effective", "Was this effective? Why or why not?")
        ]
      },
      {
        type: "knowledge",
        title: "Conflict: A Fact of Life",
        items: [
          "Conflict between people is a fact of life - and it's not necessarily a bad thing.",
          "Once you find yourself in a conflicted situation with someone else, it is important to reduce the emotional charge from the situation so that you and the other person can communicate rationally about the conflict and resolve it. Good communication skills are essential to resolving conflict quickly and effectively."
        ],
        rawText: text
      },
      {
        type: "table",
        tableKind: "translator",
        title: "Communication Skills Translator",
        columns: ["Poor communication skills", "Good communication skills"],
        rows: communicationLines.slice(0, 11).map((line) => [line, ""])
      }
    ]
  };
}

function buildCaseStudiesSection(text) {
  const joeNarrative = getSlice(text, "Joe lent Craig, his best friend, $100 six weeks ago.", ["Amanda has known Joanne since 3rd grade."]);
  const amandaNarrative = getSlice(text, "Amanda has known Joanne since 3rd grade.", ["Maya and Leticia consider themselves best friends."]);
  const mayaNarrative = getSlice(text, "Maya and Leticia consider themselves best friends.", []);

  return {
    id: "case-studies",
    sourceTitle: "Summative Task: Case Studies",
    normalizedTitle: "Case Studies",
    order: 7,
    blocks: [
      {
        type: "case_set",
        title: "Case Study Response Lab",
        cases: [
          {
            id: "joe-craig",
            title: "Joe and Craig",
            narrative: `Joe lent Craig, his best friend, $100 six weeks ago. ${narrativeOnly(joeNarrative)}`.trim(),
            questions: [
              "How do you think Jon should handle this situation? Why?",
              "How do you think Craig will react? Why?",
              "What if Craig told Joe that he needed the money to fix his car? Does this change how Jon should handle the situation?"
            ]
          },
          {
            id: "amanda-joanne",
            title: "Amanda and Joanne",
            narrative: `Amanda has known Joanne since 3rd grade. ${narrativeOnly(amandaNarrative)}`.trim(),
            questions: [
              "How do you think Amanda should handle this situation? Why?",
              "How do you think Joanne will react? Why?",
              "What if Joanne told Amanda that her family would kick her out of the house if they found out she was staying with her boyfriend? Does this change how Amanda should handle the situation?"
            ]
          },
          {
            id: "maya-leticia",
            title: "Maya and Leticia",
            narrative: `Maya and Leticia consider themselves best friends. ${narrativeOnly(mayaNarrative)}`.trim(),
            questions: [
              "How do you think Maya should handle this situation? Why?",
              "How do you think Leticia will react? Why?",
              "What if Leticia told Maya that her boyfriend said he would dump her if she didn't lose weight? Does this change how Maya should handle the situation?"
            ]
          }
        ]
      }
    ]
  };
}

function buildReviewSection() {
  return {
    id: "review-submit",
    sourceTitle: "Review & Submit",
    normalizedTitle: "Review & Submit",
    order: 8,
    blocks: [
      {
        type: "other",
        rawText: "Confirm each section is complete, then export your teacher-view text file for Brightspace submission."
      }
    ]
  };
}

export function normalizeSourceMaterial({
  courseSlug,
  unitSlug,
  title,
  sourceFiles = [],
  corpus
}) {
  const normalizedCorpus = normalizeText(corpus);

  const advertisingText = getSlice(normalizedCorpus, "Resources: Who Decides What You Buy", ["Resources: What are you Waiting For?"]);
  const waitingText = getSlice(normalizedCorpus, "Resources: What are you Waiting For?", ["Resources: Managing your Money"]);
  const purchaseResearchText = getSlice(normalizedCorpus, "Resources: Managing your Money", ["Resources: Relationships"]);
  const honestyText = getSlice(normalizedCorpus, "Resources: Relationships", ["Resources: Maintaining Positive Relationships"]);
  const conflictText = getSlice(normalizedCorpus, "Resources: Maintaining Positive Relationships", ["Summative Task: Managing Money"]);
  const summativeBudgetText = getSlice(normalizedCorpus, "Summative Task: Managing Money", ["Summative Task: Case Studies"]);
  const caseStudiesText = getSlice(normalizedCorpus, "Summative Task: Case Studies", []);

  return {
    courseSlug,
    unitSlug,
    title,
    sourceFiles,
    sections: [
      buildLaunchSection(),
      buildSpendingSection(advertisingText),
      buildJoeVsSallySection(waitingText),
      buildBudgetSection(purchaseResearchText, summativeBudgetText),
      buildHonestySection(honestyText),
      buildConflictSection(conflictText),
      buildCaseStudiesSection(caseStudiesText),
      buildReviewSection()
    ]
  };
}
