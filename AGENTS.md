# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

DIBA (Learning AI Memory Helper) is a standalone TypeScript library (ESM, Node ≥ 18) with zero runtime dependencies. See `README.md` for full details.

### Key commands

| Action | Command |
|--------|---------|
| Install deps | `npm install` |
| Build | `npm run build` (runs `tsc`) |
| Run | `npm start` (runs compiled `dist/index.js`) |
| Type-check / lint | `npx tsc --noEmit` |
| Run TS directly | `npx tsx src/index.ts` |

### Non-obvious caveats

- **No ESLint / Prettier configured.** Use `npx tsc --noEmit` as the lint equivalent; it catches type errors across the whole project.
- **`npm run dev` is broken** — the script calls `ts-node` which is not in `devDependencies` and has ESM compatibility issues. Use `npx tsx src/index.ts` instead for running TypeScript source directly without compiling.
- **ESM-only project** — all internal imports must use `.js` extensions (e.g. `from "./memory.js"`), even though source files are `.ts`. This is a TypeScript + NodeNext module resolution requirement.
- **No automated test suite** — there are no unit/integration tests. Verify changes with `npm run build` (zero errors) and `npm start`.
- **No external services needed** — memory is in-process (`Map`) with optional JSON file persistence. No database, Docker, or API keys required.
