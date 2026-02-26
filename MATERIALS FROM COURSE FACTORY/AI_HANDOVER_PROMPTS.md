# Course Factor: AI Handover Prompts
Use these prompts when starting a new chat session to ensure all AI tools (Cursor, Codex, Gemini) share the same "Long-Term Memory."

---

## 🤖 1. For CURSOR (Agent Mode)
*Cursor reads the `.cursor/rules/` folder automatically. Use this to sync the current task.*

**Prompt:**
> "I am starting a new session on Course Factor. Please read @LOG.md to synchronize with our current progress. Summarize the 'Active Goal' and 'Next Step' from the log, then wait for my instructions."

---

## 💻 2. For CODEX / GEMINI / OTHERS
*These tools do not read Cursor rules automatically. This prompt forces them to ingest the Master Rules.*

**Prompt:**
> "I am working on 'Course Factor.' Please read @UNIVERSAL_RULES.md for our architectural standards and @LOG.md for our current progress. 
> 
> **Important:** Do NOT read the entire `App.jsx` (12k lines) yet. 
> 
> Summarize the 'Active Goal' from the log and confirm you have loaded the rules."

---

## 🔚 3. SESSION CLOSE (Use in any tool)
*Use this before closing any chat to update the project memory.*

**Prompt:**
> "We are finishing this session. Please summarize what we built/fixed and provide a draft update for the 'Progress Log', 'Active Goal', and 'Next Step' sections of @LOG.md so I can keep our memory in sync."
