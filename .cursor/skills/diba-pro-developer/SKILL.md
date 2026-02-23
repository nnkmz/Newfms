---
name: diba-pro-developer
description: Apply pro developer standards when working with the DIBA (Learning AI Memory Helper) codebase. Use when editing src/diba/, extending Diba API, adding memory features, or when the user asks for DIBA improvements, DIBA skills, pro developer practices, or multi-language code support for Diba.
---

# DIBA Pro Developer

Pro developer standards for the DIBA module (Diba – Learning AI Memory Helper).

## Pelbagai bahasa kod (multi-language code)

DIBA **boleh guna pelbagai bahasa pengaturcaraan**. Jangan anggap projek atau memori terhad kepada satu bahasa sahaja.

- **Bahasa yang disokong:** TypeScript, JavaScript, Python, Go, Rust, Java, C#, Ruby, PHP, SQL, shell, dan lain-lain — bila bantu pengguna dengan kod, ikut bahasa projek/konteks.
- **Memori:** `learn`/`recall` boleh simpan snippet, nama fail, atau konteks dalam apa jua bahasa; guna `tags` atau `context` untuk nyatakan bahasa (cth. `tags: ["python", "api"]`).
- **Integrasi:** Pakej ini ditulis dalam TypeScript/Node untuk runtime, tetapi DIBA sebagai pembantu memori dan konsep kebolehan (DIBA) adalah **language-agnostic** — boleh dipanggil dari atau digabung dengan projek dalam bahasa lain (contoh: Python app panggil API, atau dokumentasi/skill untuk pelbagai stack).
- Bila pengguna minta contoh kod, tanya atau ikut bahasa yang disebut; jangan paksa satu bahasa sahaja.
- **Membangunkan kod:** DIBA boleh **develop/tulis kod** dalam pelbagai bahasa aturcara; tawarkan bila pengguna minta buat script, modul, API, atau projek baru.

## Pengkhususan DIBA (Specializations)

DIBA boleh mengkhusus dalam domain berikut; gunakan bila pengguna minta bantuan dalam bidang ini:

| Bidang | Fokus |
|--------|--------|
| **Professional** | Business analysis, project management, strategic planning |
| **Educational** | Tutoring, study assistance, curriculum development |
| **Creative** | Writing support, brainstorming, artistic collaboration |
| **Personal** | Life coaching, goal tracking, decision support |
| **Technical** | Code review, troubleshooting, system design, code development (pelbagai bahasa), multi-language programming |

## Ciri lanjutan (Advanced Features)

DIBA menyokong ciri lanjutan berikut; rujuk bila reka atau dokumentasi fitur:

- **Auto-Archive:** Fail diari diarkibkan automatik pada 1k baris.
- **Session RAM:** Memori sementara yang diset semula setiap perbualan.
- **Protocol System:** Cipta tingkah laku dan respons AI tersuai.
- **Self-Update:** AI mengubah suai memori sendiri melalui perbualan.
- **Modular Design:** Tambah atau buang ciri mengikut keperluan.
- **Save Diary System:** Dokumentasi sesi harian; satu fail/hari, append-only; arkib bulanan; `Feature/Save-Diary-System/`; trigger "save diary" / "Load save-diary".
- **Echo Memory Recall:** Carian diari + ingat semula naratif; jangan reka konteks lalu; `Feature/Echo-Memory-Recall/`; trigger "Do you remember..." / "Load echo-recall".

Definisi penuh dalam `src/diba/capabilities.ts` (DIBA_SPECIALIZATIONS, DIBA_ADVANCED_FEATURES, DIBA_FEATURE_SYSTEMS). Skill Cursor: `.cursor/skills/save-diary/`, `.cursor/skills/echo-recall/`.

## When to Use This Skill

- Editing or adding code in `src/diba/`
- Extending the Diba API (new methods, options, or types)
- Adding memory/store behaviour (learn, recall, persist)
- Defining or changing DIBA acronym/capabilities
- Reviewing or refactoring DIBA for quality and maintainability

## DIBA Module Layout

| File | Role |
|------|------|
| `types.ts` | Shared types only: MemoryEntry, LearnInput, RecallResult, DibaContext, DibaCapability |
| `acronym.ts` | DIBA name, tagline, DIBA_ACRONYM, getDibaAcronymSummary() |
| `capabilities.ts` | DIBA_SPECIALIZATIONS, DIBA_ADVANCED_FEATURES (pengkhususan & ciri lanjutan) |
| `memory.ts` | DibaMemoryStore: learn, recall, getById, delete, clear, optional JSON persist |
| `Diba.ts` | Facade class Diba: capability + memory; options: memoryPersistPath, context |
| `index.ts` | Public exports only; no new logic |

## Pro Developer Rules

### TypeScript

- Use strict types; avoid `any`. Prefer `unknown` for generic values (e.g. `MemoryEntry.value`).
- Use `type` / `interface` from `types.ts`; do not duplicate definitions.
- Imports: use `.js` extension in path for ESM (e.g. `from "./memory.js"`).
- Use `readonly` and `as const` where appropriate (e.g. DIBA_ACRONYM).

### API Design

- New public API: add to `Diba` or export from `index.ts`; keep backward compatibility.
- Options: use options objects (e.g. DibaOptions, MemoryStoreOptions) with JSDoc.
- Async: methods that touch store or disk must return `Promise<>`; keep sync methods (e.g. getById, intro) synchronous.

### Memory & Persist

- Learn: upsert by `key`; preserve `id`, `createdAt`, `accessCount` on update.
- Recall: filter by key/context/tags/value (case-insensitive); sort by updatedAt desc; respect limit.
- Persist: optional; use `node:fs/promises`; load on init in background, catch and start empty on error.
- Do not add dependencies in package.json that reference the package itself (no self-dependency).

### Naming & Behaviour

- Keep DIBA acronym: D (Dynamic Learning), I (Intelligent Recall), B (Brain-like Memory), A (Adaptive Assistant).
- Method names: learn, recall, forget, clearMemory, getMemoryById, getCapability, intro.
- Timestamps: ISO 8601 strings; use single `now()` helper for consistency.

### Quality Checklist

- [ ] New types in `types.ts` and exported from `index.ts` if public.
- [ ] JSDoc on public functions and options.
- [ ] No self-reference in package.json dependencies.
- [ ] Build passes: `npm run build`; run `node dist/index.js` to smoke-test.

## Quick Reference

```ts
// Public API (from index)
import { Diba, getDibaAcronymSummary, DibaMemoryStore } from "diba-ai-memory-helper";
import type { MemoryEntry, LearnInput, RecallResult, DibaContext } from "diba-ai-memory-helper";

const diba = new Diba({ memoryPersistPath?: string, context?: DibaContext });
await diba.learn({ key, value, context?, tags? });
const result = await diba.recall(query?, limit?);
```
