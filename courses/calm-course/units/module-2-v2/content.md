## Module Launch

Welcome to **CALM Module 2: Resource Choices**. This guided workbook keeps the source sequence intact while giving you clearer prompts, stronger pacing, and a cleaner export at the end.

:::workbook
title: Student Setup
layout: split
description: Start with your name and one decision pattern you want to improve during this module.
fields:
  - type: text
    id: student-name
    label: "Student Name"
  - type: textarea
    id: launch-focus
    label: "What is one spending or relationship decision pattern you want to improve in this unit?"
    hint: "Think about ads, money habits, honesty, conflict, or impulse buying."
    autosize: true
    rows: 4
:::

## Spending Influences

Advertising is designed to influence your choices, feelings, and behaviour. Strong consumers learn to name the pressure before they spend.

:::knowledge
title: "Influences in Marketing"
open: true
body: |
  Marketing and packaging are not neutral. They are designed to shape attention, emotion, and buying behaviour. Before you answer the workbook prompts, identify what usually pushes you toward a purchase: advertising, social approval, convenience, routine, or lifestyle image.
:::

:::workbook
title: Spending Influence Audit
description: Capture the patterns that most affect your buying decisions.
fields:
  - type: text
    label: "Define marketing in your own words."
  - type: text
    label: "Define packaging in your own words."
  - type: textarea
    label: "How might friends or family influence what you spend money on? Use one example from your own life."
    hint: "Name a real purchase where someone else's opinion affected your choice."
    autosize: true
    rows: 4
  - type: textarea
    label: "Identify one store or brand you return to often. Why do you usually buy from them?"
    hint: "Think about trust, style, convenience, price, or habit."
    autosize: true
    rows: 4
  - type: textarea
    label: "Which influence affects your spending the most right now, and why?"
    hint: "Choose one main pressure instead of listing everything."
    autosize: true
    rows: 4
:::

:::ranking
title: Rank The Biggest Spending Influences
instructions: Rank these from strongest influence on your current spending to weakest.
items:
  - "Advertising and marketing"
  - "Opinions of friends or family"
  - "Habit and familiarity"
  - "Lifestyle changes"
  - "Personal expectations and values"
:::

:::scenario
title: What Is Driving The Purchase?
description: Choose the factor that best explains each situation.
prompts:
  - id: trendy-shoes
    question: "You buy a specific shoe brand because everyone in your friend group is wearing it. What is the main influence?"
    options:
      - label: "Peer and significant-other influence"
        outcome: "Yes. Social approval and belonging are driving the decision."
      - label: "Pure product research"
        outcome: "Not likely. The strongest signal here is social pressure, not careful comparison."
  - id: same-store
    question: "You always go back to the same store because the last few purchases worked out well. What is the main influence?"
    options:
      - label: "Habit"
        outcome: "Correct. Repeated satisfactory purchases often create automatic buying patterns."
      - label: "Lifestyle change"
        outcome: "Less accurate. Nothing in the prompt suggests a major life shift is driving the purchase."
:::

## Joe vs. Sally

The workbook contrasts a high-cost "cool" purchase with a lower-cost transportation decision plus steady investing.

:::knowledge
title: "The Price of Cool: Joe vs. Sally"
open: true
body: |
  Joe chooses image first and locks himself into years of payments. Sally chooses a lower-cost vehicle and uses the monthly difference to build future stability. The point is not the specific car. The point is how one choice creates debt pressure while the other creates options.
:::

:::workbook
title: The Price Of Cool
fields:
  - type: textarea
    label: "Why do you think Joe bought a new Camaro? Explain your thinking."
    hint: "Consider status, image, attention, and instant gratification."
    autosize: true
    rows: 4
  - type: textarea
    label: "Why do you think Sally bought a used Escort? Explain your thinking."
    hint: "Think about flexibility, cost control, and future goals."
    autosize: true
    rows: 4
  - type: textarea
    label: "Who made the better long-term decision? Explain your thinking."
    autosize: true
    rows: 4
:::

:::decision-tree
title: Cost Of A Choice
description: Follow the trade-off between image, debt, flexibility, and future assets.
nodes:
  - id: start
    prompt: "You have savings and want a car. What matters more right now?"
    choices:
      - label: "Looking impressive immediately"
        next: financed
      - label: "Keeping options open and building stability"
        next: practical
  - id: financed
    prompt: "A financed purchase creates monthly payments, interest, and less flexibility when life changes."
    choices:
      - label: "Accept the long-term cost for the short-term image"
        next: debt
      - label: "Reconsider and lower the cost of the purchase"
        next: practical
  - id: debt
    prompt: "The item loses novelty, but the payment commitment stays."
    end: true
  - id: practical
    prompt: "A lower-cost decision preserves money for saving, investing, or unexpected expenses."
    end: true
:::

## Purchase Research

Before buying something significant, the workbook asks you to slow down and research the choice.

:::workbook
title: Smart Purchase Check
description: Test one real purchase against the worksheet's consumer checklist.
fields:
  - type: text
    label: "Item purchased or item you are considering"
  - type: checklist
    label: "Which research steps did you complete before buying?"
    options:
      - "I asked whether I actually need it"
      - "I checked if it could be borrowed, rented, or replaced by something I already own"
      - "I compared prices and quality"
      - "I checked return, exchange, or refund rules"
      - "I looked for hidden costs like fees, insurance, or maintenance"
      - "I asked questions before buying"
  - type: textarea
    label: "Do you think enough research was done before this purchase? Why or why not?"
    hint: "Mention at least one thing that was checked and one thing that was missed."
    autosize: true
    rows: 4
:::

:::scenario
title: Consumer Checkpoint
description: Choose the stronger consumer move.
prompts:
  - id: sale-item
    question: "A sale item looks cheap, but you are not sure whether the store only offers in-store credit. What is the strongest move?"
    options:
      - label: "Buy it now before the sale ends and figure out returns later"
        outcome: "Weak consumer judgment. Return rules can completely change whether a 'deal' is worth it."
      - label: "Check the return, refund, and receipt policy before paying"
        outcome: "Strong. Policy details matter as much as sticker price."
  - id: hidden-costs
    question: "A product fits your budget upfront, but it may involve extra fees later. What should you do?"
    options:
      - label: "Count only the purchase price"
        outcome: "Weak. Big decisions get distorted when ongoing costs are ignored."
      - label: "Estimate the full cost, including follow-up expenses"
        outcome: "Correct. Good consumer decisions account for total cost, not just initial price."
:::

## Budget Builder

:::workbook
title: Monthly Budget Builder
layout: budget-grid
description: Build a current monthly budget using the same categories from the source workbook.
fields:
  - type: text
    label: "Income from job"
  - type: text
    label: "Income from parents or family"
  - type: text
    label: "Other income (scholarship, grant, gifts, side work)"
  - type: text
    label: "Rent or room and board"
  - type: text
    label: "Utilities"
  - type: text
    label: "Phone"
  - type: text
    label: "Groceries"
  - type: text
    label: "Car payments"
  - type: text
    label: "Insurance"
  - type: text
    label: "Gas or transportation"
  - type: text
    label: "Entertainment"
  - type: text
    label: "Dining or snacking out"
  - type: text
    label: "Clothes"
  - type: text
    label: "Other expenses"
  - type: textarea
    label: "Where does most of your money come from?"
    autosize: true
    rows: 3
  - type: textarea
    label: "Where does most of your money go?"
    autosize: true
    rows: 3
  - type: textarea
    label: "At the end of the month, are you saving money or going into debt? What are your plans?"
    hint: "Name whether you are ahead, even, or behind, then state your next adjustment."
    autosize: true
    rows: 4
  - type: textarea
    label: "Looking at your budget, what is one thing you would like to do differently?"
    autosize: true
    rows: 4
:::

## Honesty and Relationship Cases

:::knowledge
title: "Healthy Relationships"
open: true
body: |
  The workbook links honesty to trust, respect, listening, shared time, and accepting boundaries. The honesty scenarios below are not just about rules. They are about what kind of person and relationship you are building.
:::

:::scenario
title: Honesty Quiz
description: Choose the response that best protects integrity and trust.
prompts:
  - id: norma
    question: "Norma finds $100 after a wealthy person drops it. She needs rent money. What is the stronger choice?"
    options:
      - label: "Keep it because she needs it more"
        outcome: "Self-justifying reasoning may feel understandable, but it still ignores honesty and ownership."
      - label: "Try to return it or report it"
        outcome: "Stronger integrity choice. Need does not automatically erase accountability."
  - id: asif
    question: "Asif gets too much change back at a store and notices after leaving. What is the stronger choice?"
    options:
      - label: "Keep it because the mistake was not his"
        outcome: "Weak. The source workbook frames this as an honesty test, not a convenience test."
      - label: "Return the extra money when possible"
        outcome: "Stronger. Honest relationships and communities depend on returning what is not yours."
  - id: frank
    question: "Frank finds an iPhone at school and knows someone who could unlock it. What is the stronger choice?"
    options:
      - label: "Keep it because nobody saw him find it"
        outcome: "Weak. Privacy and ownership still matter even when there are no witnesses."
      - label: "Turn it in so it can be returned"
        outcome: "Correct. Accountability matters more than personal opportunity."
:::

:::workbook
title: Honesty Reflection
fields:
  - type: textarea
    label: "When is it important to be honest? Describe situations."
    autosize: true
    rows: 4
  - type: textarea
    label: "When is it acceptable to omit the truth or hold something back? Describe situations."
    autosize: true
    rows: 4
  - type: textarea
    label: "Which honesty scenario was easiest for you to decide, and why?"
    autosize: true
    rows: 3
  - type: textarea
    label: "Which honesty scenario was hardest for you to decide, and why?"
    autosize: true
    rows: 3
  - type: textarea
    label: "Do you believe honesty is important to healthy relationships? Why or why not?"
    autosize: true
    rows: 4
:::

## Conflict and Communication

:::knowledge
title: "Conflict: A Fact of Life"
open: true
body: |
  Conflict is normal. What matters is whether you escalate it or handle it with clarity. Stronger communication usually means calmer tone, listening first, staying specific, and addressing the issue instead of attacking the person.
:::

:::workbook
title: Conflict Reflection
layout: case-stack
fields:
  - type: text
    label: "Define conflict in your own words"
  - type: textarea
    label: "Think of a conflict with a friend or family member. What were you arguing about?"
    autosize: true
    rows: 3
  - type: textarea
    label: "How did you try to resolve the conflict?"
    autosize: true
    rows: 3
  - type: textarea
    label: "Was your approach effective? Why or why not?"
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
    label: "Joe lent Craig $100 six weeks ago. How should Joe handle the situation, and why?"
    hint: "Aim for direct communication, not avoidance or aggression."
    autosize: true
    rows: 4
  - type: textarea
    label: "Amanda no longer wants to cover for Joanne. How should Amanda handle the situation, and why?"
    autosize: true
    rows: 4
  - type: textarea
    label: "Maya is worried about Leticia's eating and body image. How should Maya raise the issue, and why?"
    autosize: true
    rows: 4
:::

## Review & Submit

:::submission
title: Review & Submit
description: Confirm each section is complete, then export your teacher-view text file for Brightspace submission.
:::
