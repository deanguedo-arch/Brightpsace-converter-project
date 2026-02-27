## Module Launch

Welcome to **CALM Module 1: Personal Choices**. This unit is designed to help you make decisions that protect your health, relationships, and long-term goals.

:::info
How to succeed in this module:
- Move section by section and complete each interactive task.
- Write concrete answers, not one-word responses.
- Use the final exit ticket to identify your top next steps.
:::

:::warning
Safety note: If a topic in this module connects to immediate harm, abuse, self-harm, or unsafe substance use, stop and contact a trusted adult, school support staff, or local emergency services.
:::

## Personal Inventory

### Habits and Learning Patterns

Before changing behavior, identify your current patterns.

:::workbook
title: Personal Inventory Snapshot
description: Capture what currently helps or hurts your performance and wellbeing.
fields:
  - type: textarea
    label: What daily habits currently support your learning, mood, and energy?
    rows: 4
  - type: textarea
    label: What habits regularly create stress, low focus, or conflict?
    rows: 4
  - type: checklist
    label: Which supports are available to you right now?
    options:
      - Consistent sleep schedule
      - Meal/snack routine
      - Quiet study space
      - Trusted adult mentor
      - Positive peer support
      - Structured planner/calendar
  - type: textarea
    label: When do you feel most focused during a normal week?
    rows: 3
  - type: textarea
    label: When are you most likely to get distracted or make impulsive choices?
    rows: 3
:::

:::ranking
title: Rank Your Current Supports
instructions: Rank these from most impactful (1) to least impactful for your week.
items:
  - Sleep and recovery routine
  - Time planning and deadlines
  - Supportive relationships
  - Healthy stress outlets
  - Academic help and check-ins
:::

:::accordion
- Why inventory first?: Strong decisions come from accurate self-awareness, not guesswork.
- What makes a useful answer?: Specific examples, realistic constraints, and clear next actions.
- What to avoid: Vague statements like "I just need to do better" without concrete steps.
:::

## SMART Goal Builder

### Build One Goal You Can Actually Execute

:::example
A strong goal includes: **specific outcome, measurable indicator, realistic scope, and timeline**.
:::

:::workbook
title: SMART Goal Construction
description: Build one personal or academic goal that you can track over the next 2-4 weeks.
fields:
  - type: text
    label: Goal statement (Specific)
    placeholder: "I will..."
  - type: text
    label: Success measure (Measurable)
    placeholder: "I can prove progress by..."
  - type: text
    label: Why this matters (Relevant)
    placeholder: "This matters because..."
  - type: text
    label: Timeline (Timed)
    placeholder: "By [date], I will..."
  - type: checklist
    label: Which supports will you use to stay on track?
    options:
      - Weekly check-in with a trusted adult
      - Daily planner reminders
      - Study/work block schedule
      - Accountability with a peer
  - type: textarea
    label: First 3 actions you will complete this week
    rows: 4
:::

:::scenario
title: Goal Quality Check
description: Choose the stronger goal response in each prompt.
prompts:
  - question: Which goal is more effective?
    options:
      - label: "Get better at school this semester."
        outcome: This is too broad. Add a specific target, timeline, and measurement.
      - label: "Raise math test average from 68% to 75% by April 30 using two study blocks per week."
        outcome: Strong SMART structure with measurable evidence and timeline.
  - question: You miss one planned action. What is the best response?
    options:
      - label: Quit the goal because momentum is gone.
        outcome: One setback does not define outcome; this response collapses progress.
      - label: Adjust the weekly plan, keep the goal, and restart with one next action.
        outcome: This preserves accountability and keeps the system functioning.
  - question: Which support strategy is strongest?
    options:
      - label: Keep the goal private and rely only on motivation.
        outcome: Motivation fluctuates; no external supports increases failure risk.
      - label: Set recurring reminders and report progress to a trusted adult weekly.
        outcome: External structure and accountability improves completion rates.
:::

:::decision-tree
title: Setback Recovery Path
description: Practice what to do when progress drops.
nodes:
  - id: start
    prompt: You miss your weekly target and feel discouraged.
    choices:
      - label: Review why it slipped and reset next week's plan.
        next: reset
      - label: Ignore the setback and hope next week is better.
        next: drift
  - id: reset
    prompt: You identify one bottleneck, reduce scope, and restart with a realistic action.
    choices:
      - label: Confirm support check-in date.
        next: support
  - id: drift
    prompt: No plan update means the same barriers continue.
    end: true
  - id: support
    prompt: Support + revision restores momentum and raises completion odds.
    end: true
:::

## Relationships and Consent

### Healthy vs Unhealthy Patterns

:::info
Healthy relationships include respect, boundaries, consent, trust, and accountability.
:::

:::workbook
title: Relationship Reflection
description: Apply relationship criteria to real-life patterns.
fields:
  - type: checklist
    label: Signals of a healthy relationship
    options:
      - Mutual respect
      - Honest communication
      - Boundary acceptance
      - Shared responsibility
      - Emotional safety
  - type: checklist
    label: Warning signs of an unhealthy relationship
    options:
      - Control or intimidation
      - Repeated boundary violations
      - Isolation from supports
      - Manipulation or guilt pressure
      - Dishonesty and blame shifting
  - type: textarea
    label: Write one clear boundary statement you could use in a pressure moment
    rows: 3
  - type: textarea
    label: Who can you contact if a relationship becomes unsafe?
    rows: 3
:::

:::ranking
title: Consent and Boundary Priorities
instructions: Rank from highest priority (1) to lowest when making relationship decisions.
items:
  - Clear consent every time
  - Physical and emotional safety
  - Respect for stated boundaries
  - Honest communication
  - Long-term wellbeing over short-term approval
:::

:::scenario
title: Consent Pressure Simulation
description: Choose the safest, most respectful response.
prompts:
  - question: A partner dismisses your boundary as "not a big deal." What is the best response?
    options:
      - label: Stay silent to avoid conflict.
        outcome: Silence can normalize boundary violations and increase risk.
      - label: Restate the boundary clearly and step away if it is not respected.
        outcome: Clear boundaries and action protect safety and self-respect.
  - question: Friends pressure you to share private relationship details.
    options:
      - label: Share everything so they stop asking.
        outcome: This can violate trust and escalate conflict.
      - label: Decline to share and protect privacy.
        outcome: Protecting privacy supports trust and emotional safety.
:::

:::decision-tree
title: Relationship Risk Path
nodes:
  - id: start
    prompt: You notice repeated disrespect for boundaries.
    choices:
      - label: Name the concern and seek support.
        next: support
      - label: Minimize it and continue.
        next: escalate
  - id: support
    prompt: Trusted support helps you evaluate options and protect safety.
    end: true
  - id: escalate
    prompt: Ignoring the pattern increases emotional and physical risk over time.
    end: true
:::

## Substance Use Decision-Making

### Alcohol, Nicotine, and Cannabis

:::accordion
- Reality check: Short-term social payoff can hide long-term academic, legal, and health consequences.
- High-risk factors: Isolation, unresolved stress, unsafe peers, and no exit plan.
- Protective factors: Refusal scripts, ride plan, trusted check-in, and clear boundaries.
:::

:::scenario
title: Party Choice Simulator
description: Apply harm-reduction and refusal strategies.
prompts:
  - question: You are offered alcohol and need to drive later.
    options:
      - label: Have one drink and "be careful."
        outcome: Any impairment raises risk for you and others.
      - label: Decline alcohol and keep your transportation plan safe.
        outcome: Safety-first decision protects legal, physical, and academic outcomes.
  - question: A friend says vaping is harmless because "everyone does it."
    options:
      - label: Try it once to fit in.
        outcome: Nicotine dependence risk can start quickly, especially with repeat exposure.
      - label: Refuse and redirect the conversation/activity.
        outcome: Refusal plus redirection reduces pressure escalation.
  - question: You feel stressed and consider substance use as your coping strategy.
    options:
      - label: Use first, think later.
        outcome: Avoidance coping tends to increase long-term stress and consequences.
      - label: Use a non-substance coping plan and contact support.
        outcome: This builds long-term resilience and safer outcomes.
:::

:::ranking
title: Protective Actions Under Pressure
instructions: Rank which actions you should do first in a high-pressure substance-use situation.
items:
  - Leave unsafe context
  - Contact trusted support
  - Use a clear refusal line
  - Rejoin safe peers/activities
  - Review transportation and home safety
:::

:::workbook
title: Refusal and Safety Plan
description: Build scripts you can use immediately in real life.
fields:
  - type: textarea
    label: Write 2 refusal lines that sound natural in your voice
    rows: 3
  - type: textarea
    label: What is your exit plan if a situation becomes unsafe?
    rows: 3
  - type: checklist
    label: Which backup safety steps will you commit to?
    options:
      - Always secure a safe ride plan
      - Keep one trusted contact informed
      - Leave at the first red flag
      - Avoid being isolated in pressure settings
  - type: textarea
    label: If a friend is in danger, what are your first 2 actions?
    rows: 3
:::

## Risk Intelligence

### Healthy Risk vs Harmful Risk

:::info
Healthy risk has growth value and safety controls. Harmful risk has low upside and high potential harm.
:::

:::ranking
title: Risk Ladder
instructions: Rank these from lowest risk (1) to highest risk in typical teen contexts.
items:
  - Presenting in class
  - Joining a new activity team
  - Driving while tired
  - Driving after substance use
  - Posting private conflict online
  - Trying nicotine products
  - Speaking up against unsafe peer behavior
:::

:::decision-tree
title: High-Risk Moment Decision Path
description: Choose responses when social pressure conflicts with safety.
nodes:
  - id: start
    prompt: Your group plans an unsafe activity and expects your participation.
    choices:
      - label: Pause, assess consequences, and refuse.
        next: assess
      - label: Join to avoid being left out.
        next: conform
  - id: assess
    prompt: You protect safety, preserve long-term options, and model leadership.
    choices:
      - label: Offer a safer alternative.
        next: leadership
  - id: conform
    prompt: Immediate approval increases chance of harm and future regret.
    end: true
  - id: leadership
    prompt: You reduce group risk and strengthen trust with responsible peers/adults.
    end: true
:::

:::workbook
title: Personal Risk Filter
description: Use this filter before major decisions this month.
fields:
  - type: text
    label: What is the actual upside of this choice?
  - type: text
    label: What is the most likely downside if it goes badly?
  - type: text
    label: Who could be affected besides me?
  - type: text
    label: What safer alternative gives similar benefit?
  - type: textarea
    label: Final decision rule you will use under pressure
    rows: 3
:::

## Addiction Continuum and Recovery Support

### From Experimentation to Dependency

:::example
Continuum model: **No use -> Use -> Misuse -> Abuse -> Dependency**. Early intervention reduces long-term harm.
:::

:::scenario
title: Continuum Classification Practice
prompts:
  - question: A student uses occasionally, no pattern, no major consequences yet.
    options:
      - label: Dependency stage
        outcome: Not accurate; dependency includes loss of control and persistent consequences.
      - label: Use/early misuse stage
        outcome: Better fit. Monitoring and support are important to prevent escalation.
  - question: A student continues despite major academic, family, and health consequences.
    options:
      - label: High-risk dependency pattern
        outcome: Correct. Intensive support and professional intervention are likely needed.
      - label: Low-risk experimentation
        outcome: This underestimates severity and delays intervention.
:::

:::workbook
title: Help-Seeking Activation Plan
description: Define exactly how you would ask for help for yourself or a friend.
fields:
  - type: textarea
    label: What are 3 warning signs that would trigger immediate help-seeking?
    rows: 3
  - type: textarea
    label: Who are your top 3 support contacts and why?
    rows: 3
  - type: text
    label: One sentence you can use to start a help conversation
  - type: checklist
    label: Which support systems will you use if risk escalates?
    options:
      - School counselor
      - Parent/guardian or trusted adult
      - Community health professional
      - Crisis hotline/emergency response
:::

## Mental Wellness and Crisis Response

### Recognize, Respond, Refer

:::warning
If someone talks about self-harm, suicide, or immediate danger, treat it as urgent. Stay with the person and involve a trusted adult/emergency services right away.
:::

:::scenario
title: Friend Disclosure Response
description: Choose the most responsible response.
prompts:
  - question: A friend says they feel hopeless and does not want to be here anymore.
    options:
      - label: Promise secrecy and keep it between you.
        outcome: Secrecy can increase danger. Immediate adult/professional support is required.
      - label: Stay with them, listen, and contact a trusted adult/emergency support now.
        outcome: This is the safest and most ethical response.
  - question: A peer shows ongoing warning signs (withdrawal, major mood shift, no sleep).
    options:
      - label: Wait and hope it improves.
        outcome: Delay can increase risk.
      - label: Document concerns and involve support early.
        outcome: Early intervention improves outcomes.
:::

:::decision-tree
title: Urgent Support Path
nodes:
  - id: start
    prompt: You observe a serious mental health red flag.
    choices:
      - label: Act now and notify support.
        next: action
      - label: Keep silent to avoid conflict.
        next: delay
  - id: action
    prompt: You connect the person to immediate support and reduce harm risk.
    end: true
  - id: delay
    prompt: Delayed action can increase risk and remove safe intervention windows.
    end: true
:::

:::workbook
title: Personal Wellness Maintenance Plan
description: Build a practical weekly plan that prevents burnout.
fields:
  - type: checklist
    label: Weekly protective habits
    options:
      - Sleep target and consistent bedtime
      - Daily movement/physical activity
      - Screen boundaries at night
      - Peer/family connection time
      - Stress reset routine
  - type: textarea
    label: Your early warning signs that stress is becoming unmanageable
    rows: 3
  - type: textarea
    label: What support action will you take within 24 hours when warnings appear?
    rows: 3
:::

## Summative Application

### Choose and Build Your Final Artifact

:::info
Choose one summative path:
- **Path A: Life Map** (identity, transitions, growth strategy)
- **Path B: Emotion and Decision Analysis** (film-based reflection)
:::

:::workbook
title: Summative Path Selection and Evidence
description: Select your path and build the evidence now.
fields:
  - type: radio
    label: Which summative path are you choosing?
    options:
      - Path A: Life Map
      - Path B: Emotion and Decision Analysis
  - type: textarea
    label: Key insight 1 (what you learned about your decision patterns)
    rows: 3
  - type: textarea
    label: Key insight 2 (what you will change moving forward)
    rows: 3
  - type: textarea
    label: Evidence you will submit to Brightspace
    rows: 3
:::

:::ranking
title: Final Submission Quality Check
instructions: Rank what matters most for a high-quality submission.
items:
  - Clear evidence from your own reflections
  - Specific actions and next steps
  - Honest analysis of risks and consequences
  - Practical support plan
  - Professional formatting and completion
:::

## Exit Ticket and Commitments

### Lock in Next Steps

:::workbook
title: 7-Day Commitment Plan
description: Make this module actionable immediately.
fields:
  - type: text
    label: One decision habit I will improve this week
  - type: text
    label: One relationship boundary I will enforce this week
  - type: text
    label: One support person I will check in with this week
  - type: textarea
    label: My 7-day action timeline
    rows: 4
  - type: checklist
    label: Submission readiness checklist
    options:
      - I completed every required section
      - My responses are specific and evidence-based
      - My summative artifact is ready to upload
      - I reviewed my safety and support plan
:::

:::example
Before submitting: read your answers once for specificity. Replace vague statements with actions, timelines, and support contacts.
:::
