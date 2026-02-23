# Save Diary System

Automated daily session documentation with monthly archival.

## What it does

- Creates **structured diary entries** for each session following [daily-diary-protocol.md](daily-diary-protocol.md)
- **One file per day** (`YYYY-MM-DD.md`), multiple entries per day via **append-only** writes
- **Monthly auto-archival:** previous month's files move to `daily-diary/archived/YYYY-MM/`
- Updates **session memory** with a recap after each diary write
- Includes **SKILL.md** for auto-triggered diary saves (e.g. "save diary", "Load save-diary")

## Quick setup

1. Go to `Feature/Save-Diary-System/`
2. Type: **"Load save-diary"** (or ask your AI to load the save-diary system)
3. Choose your diary name if prompted (customizable to match your AI's personality)
4. Diary folder `daily-diary/` is created if needed; skill is used when the plugin system exists

## Benefits

- Complete **searchable history** of all AI sessions
- **Growth tracking** over time for both AI and user
- **Never lose context** about past work and decisions
- **Self-documenting** with minimal user effort
- **Clean monthly archival** keeps the workspace organized

## Platform note

The diary system works with **any AI platform**. The included SKILL.md is for Cursor (and compatible skill systems). On platforms with different plugin systems, use the protocol for manual setup: create `daily-diary/`, follow `daily-diary-protocol.md`, and trigger saves manually or via your platform's automation.

Based on proven daily documentation systems in production AI companions.
