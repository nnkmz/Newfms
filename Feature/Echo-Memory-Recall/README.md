# Echo Memory Recall

Search and recall past sessions with narrative context.

## What it does

- **Keyword-based search** across all diary entries (current and archived months)
- **Three-level recall:** search + narrative, uncertainty guard, ask-user fallback
- **Auto-triggers** on natural phrases: "do you remember", "when did we", "recall"
- Presents results as **natural conversation**, not raw database output
- **Never fabricates** past context — always searches diary evidence first

## Quick setup

1. Go to `Feature/Echo-Memory-Recall/`
2. Type: **"Load echo-recall"** (or ask your AI to load the echo-recall system)
3. Choose your recall system name if prompted (customizable to match your AI's personality)
4. Recall protocol is then used for "Do you remember..."-style questions

## Benefits

- **Long-term memory** beyond the AI's context window
- **Truthful recall** backed by diary evidence
- **Natural narrative** responses that feel like genuine memory
- **Graceful uncertainty** (asks user when nothing found)
- Works with **any diary format** (Save-Diary-System or existing protocol)

## Dependencies

- A diary source: **Save-Diary-System** (`Feature/Save-Diary-System/`) or your own diary files under `daily-diary/` and `daily-diary/archived/`.
