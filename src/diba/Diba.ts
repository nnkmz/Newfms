/**
 * Diba – Learning AI Memory Helper
 * Single facade: capability (acronym) + memory (learn/recall).
 */

import { getDibaAcronymSummary } from "./acronym.js";
import { DibaMemoryStore } from "./memory.js";
import type { DibaContext, LearnInput, MemoryEntry, RecallResult } from "./types.js";

export interface DibaOptions {
  /** Optional file path to persist memory (JSON). */
  memoryPersistPath?: string;
  /** Optional context (user/session) for Adaptive Assistant behaviour. */
  context?: DibaContext;
}

/**
 * Diba AI Assistant: DIBA capability model + memory engine.
 */
export class Diba {
  readonly memory: DibaMemoryStore;
  readonly context: DibaContext | undefined;

  constructor(options: DibaOptions = {}) {
    this.memory = new DibaMemoryStore({
      persistPath: options.memoryPersistPath,
    });
    this.context = options.context;
  }

  /** Capability summary: name, tagline, acronym, and DIBA letters. */
  getCapability() {
    return getDibaAcronymSummary();
  }

  /** Learn a fact (Dynamic Learning + Brain-like Memory). */
  async learn(input: LearnInput): Promise<MemoryEntry> {
    return this.memory.learn(input);
  }

  /** Recall from memory by query (Intelligent Recall). */
  async recall(query: string = "", limit?: number): Promise<RecallResult> {
    return this.memory.recall(query, limit);
  }

  /** Get one entry by id. */
  getMemoryById(id: string): MemoryEntry | undefined {
    return this.memory.getById(id);
  }

  /** Delete one memory entry. */
  async forget(id: string): Promise<boolean> {
    return this.memory.delete(id);
  }

  /** Clear all memory (use with care). */
  async clearMemory(): Promise<void> {
    return this.memory.clear();
  }

  /** Intro message including acronym – for CLI or API. */
  intro(): string {
    const cap = getDibaAcronymSummary();
    const lines: string[] = [
      `Saya ${cap.name} – ${cap.tagline}.`,
      "",
      "DIBA:",
      ...cap.capabilities.map(
        (c) => `  ${c.letter} - ${c.fullName}: ${c.descriptionMs ?? c.description}`
      ),
    ];
    return lines.join("\n");
  }
}
