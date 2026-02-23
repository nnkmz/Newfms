---
name: echo-recall
description: Searches diary entries and recalls past sessions as natural narrative. Use when the user says "do you remember", "when did we", "recall", "what did we decide", "last time we", or asks to load the recall system ("Load echo-recall").
---

# Echo Memory Recall

## When to run

- User says: "Do you remember...", "When did we...", "Recall...", "What did we decide about...", "Last time we...", or similar.
- User asks to **"Load echo-recall"** or set up the recall system.

## What to do

1. **Search diary first**
   - Search in `daily-diary/*.md` and `daily-diary/archived/**/*.md` (or configured paths).
   - Use keyword/search from the user's question (e.g. project name, topic, date hint).

2. **Three-level behavior** (see [echo-recall-protocol.md](echo-recall-protocol.md)):
   - **Search + narrative:** Turn matches into a short, natural summary (e.g. "On [date] we decided…").
   - **Uncertainty guard:** If nothing found or unclear, say so; never invent past context.
   - **Ask-user fallback:** If no results or ambiguous, ask the user to clarify.

3. **Respond in conversation**
   - Reply as natural language, not raw search results or file dumps.

4. **Setup ("Load echo-recall")**
   - Confirm diary path exists (Save-Diary-System or existing diary).
   - Confirm: "Echo Memory Recall is ready. Ask 'Do you remember...' to search past sessions."

## Rules

- **Never fabricate** past sessions. Only state what appears in diary evidence.
- Works with any diary format (Save-Diary-System or your own); adapt paths if different.
