# UNIVERSAL RULES: Course Factor
*Copy and paste this into any new chat (Gemini, Codex, etc.) to synchronize all AI tools.*

## 1. Project Identity & Role
- **Project:** 'Course Factor' (Sports Psychology Course Engine).
- **Tech Stack:** React 19 (Hooks/Vite), Tailwind CSS 4, Firebase.
- **User Role:** Non-Coder Architect. Focus on **results**, not code theory. Use analogies.

## 2. Technical Guardrails (CRITICAL)
- **Monolith Warning:** `src/App.jsx` is 12,000+ lines. Do NOT read the whole file. Use `grep` to find specific functions.
- **Google Sites Legacy:** All JS functions must be attached to `window` (e.g., `window.myFunc = myFunc;`). Use Event Delegation for dynamic content.
- **Beta Deployment:** Beta mode uses a structured ZIP export for static hosting (GitHub Pages). No `window` hacks needed here.
- **Parser Integrity:** The **V7 Gap-Parser** (line ~2400) is frozen logic. Do not refactor it.

## 3. UI & Design System
- **Aesthetic:** Neo-Brutalist (Dark Slate backgrounds, sharp 2px borders, vibrant accents).
- **Component Reuse:** Use existing `<CodeBlock />`, `<Toggle />`, and `useToast` hook. Do not reinvent them.

## 4. Operational Efficiency
- **Memory Sync:** Read `LOG.md` before starting. Update `LOG.md` before finishing.
- **Token Economy:** Use SEARCH/REPLACE blocks. Chain steps.
- **Confidence Check:** If unsure (<90%), STOP. Propose a safe test before breaking core logic.

---
**Note to AI:** This file is the "Master Source of Truth" for non-Cursor agents.
