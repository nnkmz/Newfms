---
name: save-diary
description: Saves a structured diary entry for the current session following the daily-diary protocol. Use when the user says "save diary", "log this session", "document this", "save to diary", or when ending a session and the user wants a record. Also use when loading or setting up the Save Diary System ("Load save-diary").
---

# Save Diary

## When to run

- User says: "save diary", "log this session", "document this", "save to diary", "record this session", or similar.
- User asks to "Load save-diary" or set up the diary system.
- Session wrap-up and user wants a persistent record.

## What to do

1. **Locate diary root**  
   Use `daily-diary/` in project root (or path from config if set).

2. **Today's file**  
   File name: `YYYY-MM-DD.md` (e.g. `2025-02-23.md`).

3. **Append one entry** using [daily-diary-protocol.md](daily-diary-protocol.md):
   - Timestamp
   - Session summary (1–3 sentences)
   - Key decisions (optional bullets)
   - Follow-ups (optional)
   - Tags (optional `#topic`)

4. **Create file/folder if missing**  
   Ensure `daily-diary/` exists; create the day file if it does not exist.

5. **Update session memory**  
   After writing, store a short recap (e.g. in DIBA memory or session RAM) so the next turn can reference "last session" without re-reading the whole file.

6. **Archival**  
   If the file is from a previous month, do not write into it; use current date. When implementing auto-archive, move files to `daily-diary/archived/YYYY-MM/` when starting a new month or when file exceeds 1k lines (see protocol).

## Quick setup ("Load save-diary")

- Ensure `Feature/Save-Diary-System/` exists with this SKILL and `daily-diary-protocol.md`.
- Create `daily-diary/` in project root.
- Optionally set diary name/personality in config or memory.
- Confirm to user: "Save Diary System is ready. Say 'save diary' to log this session."
