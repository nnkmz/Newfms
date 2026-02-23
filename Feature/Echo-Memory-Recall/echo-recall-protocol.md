# Echo Memory Recall Protocol

Search and recall past sessions with narrative context. Use this when the user asks about the past or when implementing recall behavior.

## Trigger phrases

Auto-trigger recall when the user says (or similar):

- "Do you remember..."
- "When did we..."
- "Recall..."
- "What did we decide about..."
- "Last time we..."
- "Earlier you said..."

## Three-level recall

1. **Search + narrative**
   - Run **keyword-based search** across all diary entries (current and archived: `daily-diary/*.md`, `daily-diary/archived/**/*.md`).
   - Build a short **narrative** from matching entries (dates, summary, decisions).
   - Respond in **natural conversation**, not raw file output or JSON.

2. **Uncertainty guard**
   - If search finds nothing or is ambiguous, say so clearly.
   - Do **not** invent or fabricate past context.
   - Prefer: "I don't have a diary entry about that" / "I couldn't find that in the logs."

3. **Ask-user fallback**
   - When nothing is found or multiple interpretations exist, **ask the user** to clarify or confirm.
   - Example: "I didn't find a note about that. Do you remember which day or project it was?"

## Rules

- **Always search diary evidence first** before stating anything as past fact.
- **Never fabricate** past sessions, decisions, or quotes.
- Present results as **natural language**, not as "Search result 1:", raw markdown dump, or database rows.
- Works with **any diary format** that has date + content (Save-Diary-System or existing protocol).

## Search scope

- Current month: `daily-diary/YYYY-MM-DD.md`
- Archived: `daily-diary/archived/YYYY-MM/*.md`
- Use keyword match on file content (e.g. grep, search-in-files); optional: index by tags/dates for speed.
