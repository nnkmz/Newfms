/**
 * DIBA Memory Engine
 * Brain-like storage: learn, associate, recall (Intelligent Recall + Brain-like Memory).
 */

import type { LearnInput, MemoryEntry, RecallResult } from "./types.js";
import { randomUUID } from "node:crypto";

const now = (): string => new Date().toISOString();

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

function matchesQuery(entry: MemoryEntry, query: string): boolean {
  const nq = normalizeQuery(query);
  if (!nq) return true;
  const keyMatch = entry.key.toLowerCase().includes(nq);
  const contextMatch = entry.context?.toLowerCase().includes(nq);
  const tagMatch = entry.tags?.some((t) => t.toLowerCase().includes(nq));
  const valueStr = typeof entry.value === "string" ? entry.value : JSON.stringify(entry.value);
  const valueMatch = valueStr.toLowerCase().includes(nq);
  return keyMatch || contextMatch || tagMatch || valueMatch;
}

export interface MemoryStoreOptions {
  /** Optional: persist to file path (JSON). Omit for in-memory only. */
  persistPath?: string;
}

export class DibaMemoryStore {
  private entries: Map<string, MemoryEntry> = new Map();
  private readonly persistPath?: string;

  constructor(options: MemoryStoreOptions = {}) {
    this.persistPath = options.persistPath;
    if (this.persistPath) {
      this.loadFromDisk().catch(() => {
        // First run or invalid file: start empty
      });
    }
  }

  /**
   * Learn: store or update a fact (Dynamic Learning + Brain-like Memory).
   */
  async learn(input: LearnInput): Promise<MemoryEntry> {
    const existing = Array.from(this.entries.values()).find((e) => e.key === input.key);
    const id = existing?.id ?? randomUUID();
    const createdAt = existing?.createdAt ?? now();
    const updatedAt = now();
    const accessCount = existing?.accessCount ?? 0;

    const entry: MemoryEntry = {
      id,
      key: input.key,
      value: input.value,
      context: input.context,
      tags: input.tags ?? [],
      createdAt,
      updatedAt,
      accessCount,
    };

    this.entries.set(id, entry);
    await this.persistIfNeeded();
    return entry;
  }

  /**
   * Recall: search memory by query (Intelligent Recall).
   */
  async recall(query: string = "", limit: number = 50): Promise<RecallResult> {
    let list = Array.from(this.entries.values());
    if (query.trim()) {
      list = list.filter((e) => matchesQuery(e, query));
    }
    // Most recently updated first
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const entries = list.slice(0, limit);
    // Bump access count for returned entries (adaptive usage)
    for (const e of entries) {
      const cur = this.entries.get(e.id);
      if (cur) {
        cur.accessCount += 1;
        cur.updatedAt = now();
      }
    }
    await this.persistIfNeeded();
    return { entries, total: list.length, query };
  }

  /**
   * Get single entry by id.
   */
  getById(id: string): MemoryEntry | undefined {
    return this.entries.get(id);
  }

  /**
   * Delete one entry by id.
   */
  async delete(id: string): Promise<boolean> {
    const ok = this.entries.delete(id);
    if (ok) await this.persistIfNeeded();
    return ok;
  }

  /**
   * Clear all in-memory entries (and persist if enabled).
   */
  async clear(): Promise<void> {
    this.entries.clear();
    await this.persistIfNeeded();
  }

  private async persistIfNeeded(): Promise<void> {
    if (!this.persistPath) return;
    const fs = await import("node:fs/promises");
    const data = JSON.stringify(Array.from(this.entries.values()), null, 2);
    await fs.writeFile(this.persistPath, data, "utf-8");
  }

  private async loadFromDisk(): Promise<void> {
    if (!this.persistPath) return;
    const fs = await import("node:fs/promises");
    const raw = await fs.readFile(this.persistPath, "utf-8");
    const arr = JSON.parse(raw) as MemoryEntry[];
    this.entries = new Map(arr.map((e) => [e.id, e]));
  }
}
