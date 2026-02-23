---
name: save-diary
description: Saves a structured diary entry for the current session. Use when the user says "save diary", "log this session", "document this", "save to diary", or "Load save-diary" to set up the Save Diary System.
---

# Save Diary

Saves session to daily diary following the **Save Diary System** protocol.

- **When:** User says "save diary", "log this session", "document this", or "Load save-diary".
- **Where:** [Feature/Save-Diary-System/](../../Feature/Save-Diary-System/) — protocol: [daily-diary-protocol.md](../../Feature/Save-Diary-System/daily-diary-protocol.md).
- **Action:** Append one entry to `daily-diary/YYYY-MM-DD.md` (create file/folder if needed). Entry: timestamp, session summary, key decisions, follow-ups, optional tags. Then update session memory with a short recap.
- **Archive:** Monthly move to `daily-diary/archived/YYYY-MM/`; auto-archive when file exceeds 1k lines (see protocol).

Quick setup: user says **"Load save-diary"**; ensure `daily-diary/` exists and confirm system ready.
