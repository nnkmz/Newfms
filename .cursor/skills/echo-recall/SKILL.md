---
name: echo-recall
description: Searches diary entries and recalls past sessions as natural narrative. Use when the user says "do you remember", "when did we", "recall", "what did we decide", "last time we", or "Load echo-recall" to set up Echo Memory Recall.
---

# Echo Memory Recall

Search and recall past sessions from diary with **narrative** answers.

- **When:** User says "Do you remember...", "When did we...", "Recall...", or "Load echo-recall".
- **Where:** [Feature/Echo-Memory-Recall/](../../Feature/Echo-Memory-Recall/) — protocol: [echo-recall-protocol.md](../../Feature/Echo-Memory-Recall/echo-recall-protocol.md).
- **Action:** Keyword-search `daily-diary/*.md` and `daily-diary/archived/**/*.md`. Respond in **natural conversation** (not raw search output). Three levels: (1) search + narrative, (2) uncertainty guard — never fabricate; say if nothing found, (3) ask-user fallback when ambiguous.
- **Rule:** Never invent past context; only state what appears in diary evidence.

Quick setup: user says **"Load echo-recall"**; confirm diary path exists (e.g. Save-Diary-System) and confirm recall ready.
