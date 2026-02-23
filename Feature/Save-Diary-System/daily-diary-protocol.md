# Daily Diary Protocol

Structured session documentation for DIBA. Follow this when creating or appending diary entries.

## Structure per entry

Each session entry in the daily file MUST include:

1. **Timestamp** — ISO 8601 or `HH:mm` in local context
2. **Session summary** — 1–3 sentences: what was discussed or done
3. **Key decisions** — Any decisions made (optional bullet list)
4. **Follow-ups** — Open items or next steps (optional)
5. **Tags** — Optional: `#topic` for searchability

## File layout

- **One file per day:** `daily-diary/YYYY-MM-DD.md`
- **Append-only:** New entries appended to the day file; do not rewrite previous entries
- **Monthly archival:** When a new month starts, move previous month's files to `daily-diary/archived/YYYY-MM/` (e.g. `archived/2025-01/`)

## Auto-archive rule

When a daily file exceeds **1000 lines**, archive it by moving to the current month's archive folder and start a new file for the same date with a suffix (e.g. `YYYY-MM-DD-part2.md`) or document the split in the protocol. Prefer moving to archive and keeping one active file per day when possible; use part-files only if the day is still current.

## After each diary write

- Update session memory with a short **recap** (e.g. last topic, last decision) so the next turn can reference it without re-reading the whole diary.

## Placeholder

- Diary root: `daily-diary/` (or configurable path)
- Archive: `daily-diary/archived/YYYY-MM/`
