# AGENTS.md

## Cursor Cloud specific instructions

### Overview

DIBA (Learning AI Memory Helper) is a standalone TypeScript/Node.js library with zero runtime dependencies. It provides an in-memory key-value store with learn/recall/forget operations and optional JSON file persistence.

### Key commands

| Action | Command |
|--------|---------|
| Install deps | `npm install` |
| Build | `npm run build` (runs `tsc`) |
| Run | `npm start` (runs `node dist/index.js`) |
| Dev (ts-node) | `npm run dev` — requires `ts-node` which is **not** in devDependencies |

### Notes for cloud agents

- **No test framework** is configured. There are no test scripts or test files. Validate changes by running `npm run build` (zero TypeScript errors = success) and `npm start`.
- **No linter** is configured. Use `tsc --noEmit` as a type-check / lint equivalent.
- **ESM only**: the project uses `"type": "module"`. All internal imports must use `.js` extensions (e.g., `from "./memory.js"`).
- **No external services** needed — no databases, no Docker, no network calls.
- The `npm run dev` script references `ts-node` but it is not installed as a dependency. Use `npm run build && npm start` instead.
- Build output goes to `dist/`. This directory is git-ignored.
