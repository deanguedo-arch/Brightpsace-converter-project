# Course Factory Dashboard

A modular course-building tool that lets you create, migrate, and compile learning modules into standalone HTML sites for embedding in Google Sites or other platforms.

## Features

- **Harvest**: Create or migrate course modules from various sources
- **Assembly**: Preview and organize modules
- **Management**: Backup, restore, and reset projects
- **Compile**: Generate standalone HTML sites ready for deployment

---

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Or use the included batch file:

```bash
RUN_BUILDER.bat
```

The app will start on `http://localhost:5173`

---

## Phase 1: Harvest - Creating Modules

The Harvest phase offers multiple ways to create and import course modules:

### 1. AI Studio Creator (NEW!) 🎯

**Use this to**: Create brand new modules OR reusable features using Google AI Studio

**Toggle: Module vs Feature**
- **Create Module**: Course-specific content (lessons, activities, quizzes)
  - Saved to "Current Course"
  - ID starts with `view-`
- **Create Feature**: Reusable components for Global Toolkit
  - Saved to "Global Toolkit" (available across all courses)
  - ID starts with `feat-`

**Workflow:**

#### Step 1: Generate AI Prompt
1. Choose "Create Module" or "Create Feature" toggle
2. Describe what you want to create
3. Click "Generate Full Prompt"
4. Copy the generated prompt

#### Step 2: Use Google AI Studio
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Paste the prompt
3. Copy the JSON response

#### Step 3: Import & Commit
1. Paste the JSON output
2. Click "Parse & Validate JSON"
3. Add a title
4. Click "Add to Project"

**Example Module Descriptions:**

```
Create a 5-question multiple choice quiz about mental fitness. 
Include immediate feedback and a score display at the end.
```

```
Create a drag-and-drop goal-setting activity with 3 categories 
(Personal, Professional, Health). Include save to localStorage 
and a reset button.
```

```
Build an interactive checklist for pre-game preparation with 
10 items. Show progress percentage and allow printing.
```

```
Design a journal entry form with date picker, mood selector, 
and text area. Save entries to localStorage and display history.
```

**Example Feature Descriptions:**

```
Create a save/load system with 3 buttons: Save Progress, 
Load Progress, and Clear All. Use localStorage with a 
configurable storage key. Show success/error toasts.
```

```
Build a universal countdown timer component. Allow setting 
minutes and seconds, show start/pause/reset buttons, and 
play a sound when time is up.
```

```
Create a progress tracker that displays X/Y completion 
with a visual progress bar. Make it configurable via 
data attributes so any module can use it.
```

```
Design a notification/toast system that can display 
success, error, warning, and info messages. Include 
auto-dismiss after 3 seconds and a close button.
```

```
Create a data export utility with buttons to export 
current form data as JSON or CSV. Include a print button 
for printer-friendly formatting.
```

---

### 2. Module/Feature Migrator

**Use this to**: Extract existing modules from monolith HTML files

**Workflow:**
1. **Scanner**: Paste large HTML file, get list of module IDs
2. **Extractor**: Enter target ID and JS prefix to extract specific module
3. **Storage**: Paste extracted JSON and commit to project

---

### 3. Material Card Generator

**Use this to**: Create material cards (PDF links, downloads) for the Course Materials module

**Inputs:**
- Title
- Description
- Embed Link (Google Drive preview URL)
- Download Link

---

### 4. Assessment Builder

**Use this to**: Build multiple-choice quizzes with auto-scoring

**Features:**
- Add/remove questions
- 4 options per question
- Mark correct answer
- Auto-generates scoring logic

---

## AI Studio Prompting Tips

### What Makes a Good Description?

**Good descriptions are:**
- **Specific**: "Create a quiz with 5 questions" not "Create a quiz"
- **Detailed**: Include interaction types (drag-drop, buttons, forms)
- **Complete**: Mention data persistence needs (localStorage, print, export)
- **Purposeful**: For features, emphasize reusability and configurability

**Module Examples:**

✅ **Good:**
```
Create an interactive weekly planner with 7 day cards. 
Each day should have 3 input fields: Morning Goal, Afternoon Task, 
Evening Reflection. Include a "Save Week" button that stores data 
to localStorage and a "Clear All" button.
```

❌ **Too Vague:**
```
Make a planner
```

**Feature Examples:**

✅ **Good:**
```
Build a reusable progress bar component. It should accept a 
current value and max value, display percentage, and show 
visual color changes (red < 33%, yellow 33-66%, green > 66%). 
Make it configurable via data attributes.
```

❌ **Too Vague:**
```
Create a progress bar
```

✅ **Good:**
```
Design a localStorage manager utility with functions to 
save, load, and clear data. Include error handling, automatic 
JSON stringification, and expiry date support. Provide a 
simple UI with test buttons.
```

❌ **Too Vague:**
```
Make a save system
```

---

## Understanding Modules vs Features

### Modules (Current Course)
- **Purpose**: Course-specific lessons, activities, and content
- **Scope**: Tied to one course
- **Examples**: 
  - Lesson 1: Introduction to Mental Fitness
  - Quiz: Week 1 Assessment
  - Activity: Goal Setting Worksheet
- **ID Format**: `view-[name]`
- **Location**: Saved to "Current Course" → visible in Phase 2/4

### Features (Global Toolkit)
- **Purpose**: Reusable components that work across all courses
- **Scope**: Available to any course project
- **Examples**:
  - Save/Load System
  - Progress Tracker
  - Countdown Timer
  - Data Export Utility
  - Toast Notification System
- **ID Format**: `feat-[name]`
- **Location**: Saved to "Global Toolkit" → visible in Phase 5

**When to use which:**
- Creating lesson content? → **Module**
- Creating a utility that multiple courses can use? → **Feature**

---

## Module Structure (Technical Reference)

Every module is stored as:

```json
{
  "id": "view-example",
  "title": "Example Module",
  "code": {
    "id": "view-example",
    "html": "<div id=\"view-example\">...</div>",
    "script": "function example_function() { ... }"
  }
}
```

**Requirements:**
- `id`: Unique identifier starting with `view-`
- `html`: Self-contained HTML with matching root ID
- `script`: JavaScript with unique function prefix

---

## Master Shell

The Master Shell is the base HTML template used when compiling modules. It includes:
- Dark theme styling
- Tailwind CSS (via CDN)
- Left sidebar navigation
- Main content area

Modules are injected into the content area and navigation is auto-generated.

---

## Phase 2: Preview & Test

Browse, preview, and test your modules and features:

### Features
- **Module/Feature Toggle**: Switch between Course Modules and Global Toolkit
- **Search**: Filter items by title or ID
- **Grid View**: Visual cards showing module info and stats
- **Quick Actions**:
  - 👁️ **Preview**: Open full-screen preview modal
  - ✏️ **Edit**: Open module editor
  - 🗑️ **Delete**: Remove module/feature
- **Stats Display**: See code size (HTML + Script) for each item
- **Section Tags**: View which section a module belongs to

### Use Cases
- Test module interactions before compiling
- Review your content library
- Quick edits without navigating away
- Verify modules work as expected

---

## Phase 3: Manage & Reset

### Backup & Restore
- **Download Backup**: Export full project as JSON
- **Upload Backup**: Restore from JSON file

### Reset Project
- Clears all modules from current course
- Keeps Global Toolkit intact
- Requires backup download first

---

## Phase 4: Compile

Generate standalone HTML site:
1. Select modules to include
2. Click "Compile Selected Modules"
3. Download generated `index.html`
4. Embed in Google Sites or host anywhere

---

## Troubleshooting

### AI Studio JSON Parse Errors

**Problem:** "Parse Error: Unexpected token"

**Solutions:**
1. Check if response includes markdown code fences (` ```json `)
   - The parser auto-detects and strips these
2. Verify the JSON structure has `id`, `html`, and `script` fields
3. Look for unescaped quotes inside the JSON strings
4. Try regenerating with a simpler description

**Example Fix:**
```json
// ❌ Bad (missing quotes)
{ id: view-example, html: <div>test</div> }

// ✅ Good
{ "id": "view-example", "html": "<div>test</div>", "script": "" }
```

### Module Not Showing in Preview

**Check:**
1. Module was committed (green success message appeared)
2. Refresh Phase 2 if needed
3. Verify module has non-empty `html` field

### Buttons Not Working in Preview

**Cause:** JavaScript functions not globally accessible

**Fix:** Ensure scripts use window-global functions:
```javascript
// ❌ Won't work in preview
function myFunc() { }

// ✅ Works
window.myFunc = function() { }
// or
function myFunc() { } // if called via onclick="" in HTML
```

---

## Project Structure

```
├── src/
│   ├── App.jsx          # Main dashboard logic
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # App shell
├── package.json         # Dependencies
└── README.md            # This file
```

---

## Technologies

- **React** 19.2.0
- **Vite** (Rolldown)
- **Tailwind CSS** 4.1.18
- **Lucide Icons**
- **Firebase** (optional, currently disabled)

---

## Best Practices

### Module Design
1. Keep modules self-contained
2. Use unique function prefixes (e.g., `quiz1_submit()`)
3. Test in Phase 2 preview before compiling
4. Save backups before major changes

### AI Prompting
1. Start simple, iterate if needed
2. Include style requirements in description
3. Mention data persistence explicitly
4. Test generated modules immediately

### Workflow
1. Create modules in Harvest (AI Studio or Migrator)
2. Preview in Assembly
3. Download backup in Manage
4. Compile final site in Phase 4

---

## Support & Contribution

This is a personal project tool. For issues or suggestions, contact the project owner.

---

## License

Private project. All rights reserved.
